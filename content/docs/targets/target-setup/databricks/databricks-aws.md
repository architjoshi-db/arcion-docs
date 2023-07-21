---
pageTitle: Documentation for Databricks Target on AWS
title: Databricks on AWS
description: "Learn how to set up Arcion with AWS Databricks. Leverage features like Type-2 CDC, Unity Catalog, and more."
url: docs/target-setup/databricks/databricks-aws
bookHidden: false
---

# Destination AWS Databricks

On this page, you'll find step-by-step instructions on how to set up your AWS Databricks instance with Arcion.

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the following steps.

## I. Obtain the JDBC Driver for Databricks

Replicant requires the Databricks JDBC Driver as a dependency. To obtain the appropriate driver, follow the steps below: 

{{< tabs "databricks-jdbc-driver-download" >}}
{{< tab "For Legacy Databricks" >}}
- Download the [JDBC 4.2-compatible Databricks JDBC Driver ZIP](https://databricks-bi-artifacts.s3.us-east-2.amazonaws.com/simbaspark-drivers/jdbc/2.6.22/SimbaSparkJDBC42-2.6.22.1040.zip).
- From the downloaded ZIP, locate and extract the `SparkJDBC42.jar` file.
- Put the `SparkJDBC42.jar` file inside `$REPLICANT_HOME/lib` directory.
{{< /tab >}}
{{< tab "For Databricks Unity Catalog" >}}
- Go to the [Databricks JDBC Driver download page](https://www.databricks.com/spark/jdbc-drivers-download) and download the driver.
- From the downloaded ZIP, locate and extract the `DatabricksJDBC42.jar` file.
- Put the `DatabricksJDBC42.jar` file inside `$REPLICANT_HOME/lib` directory.
{{< /tab >}}

{{< /tabs >}}


## II. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:
    ```BASH
    vi conf/conn/databricks.yaml
    ```

2. The configuration file has two parts:

    - Parameters related to target Databricks server connection.
    - Parameters related to stage configuration.

    ### Parameters related to Target Databricks server connection
    {{< hint "info" >}}
  **Note:** All communications with Databricks happen through port 443, the standard port for HTTPS. So all data is encrypted and secure with SSL by default.
    {{< /hint >}}
    If you store your Databricks server connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}). 
    
    Otherwise, you can put your credentials in plain form like the sample below:

      ```YAML
      type: DATABRICKS_DELTALAKE

      host: HOSTNAME
      port: PORT_NUMBER

      url: "jdbc:spark://<host>:<port>/<database-name>;transportMode=http;ssl=1;httpPath=<http-path>;AuthMech=3" #You can copy this URL from Databricks cluster info page

      username: "USERNAME"                         
      password: "PASSWORD"                            
      max-connections: 30 #Maximum number of connections Replicant can open in Databricks
      max-retries: 100 #Number of times any operation on the source system will be re-attempted on failures.
      retry-wait-duration-ms: 1000 #Duration in milliseconds replicant should wait before performing then next retry of a failed operation
      ```

      Replace the following:
      - *`HOSTNAME`*: the hostname of your Databricks host
      - *`PORT_NUMBER`*: the port number of the Databricks cluster
      - *`USERNAME`*: the username that connects to your Databricks server
      - *`PASSWORD`*: the password associated with *`USERNAME`*
    
      {{< hint "info" >}}For [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog), set the connection `type` to `DATABRICKS_LAKEHOUSE`. For more information, see [Databricks Unity Catalog Support](#databricks-unity-catalog-support-beta).{{< /hint >}}

    
    ### Parameters related to stage configuration
    It is mandatory to use `DATABRICKS_DBFS` or an external stage like S3 to hold the data files and load them on the target database from there. The `stage` section allows specifying the details Replicant needs to connect to and use a given stage.

      - `type`*[v21.06.14.1]*: The stage type. Allowed stages are `S3`, `AZURE`, `GCP`, and `DATABRICKS_DBFS`.
      {{< hint "info" >}}For [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog), set `type` to `DATABRICKS_LAKEHOUSE`. For more information, see [Databricks Unity Catalog Support](#databricks-unity-catalog-support-beta).{{< /hint >}}
      - `root-dir`: Specify a directory on stage which can be used to stage bulk-load files.
      - `conn-url`*[v21.06.14.1]*: Specify the connection URL for stage. For example, for S3 as stage, specify bucket-name; for AZURE as stage, specify the container name.
      - `use-credentials`: Applicable only for `DATABRICKS_DBFS` as type. Indicates whether to use the provided connection credentials. When `true`, you must set  `host`, `port`, `username`, and `password` as described in the section [Parameters Related to Target Databricks server connection](#parameters-related-to-target-databricks-server-connection).

        *Default: By default, this parameter is set to `false`.*
        
      - `key-id`: This config is valid for `S3` as stage `type` only. Represents Access Key ID for AWS account hosting S3.
      - `account-name`*[v21.06.14.1]*: This config is valid for AZURE type only. Represents name of the ADLS storage account.
      - `secret-key`*[v21.06.14.1]*: This config is valid for S3 and AZURE type only. For example, Secret Access Key for AWS account hosting S3 or ADLS account.
      - `credential-file-path`: For `GCP` as stage `type` only. Represents the absolute path to the service account key file. For more information, see [GCP as stage](#gcp-as-stage).
      - `assume-role`: For `S3` as stage `type` only. Use this parameter to configure ARNs (Amazon Resource Name) for roles. It has the following configurable fields:
        - `enable`: `true` or `false`. Whether to enable this option.
        - `role-arn`: The ARN specifying the role—for example `arn:aws:iam::123456789012:role/S3Access`.
        - `session-duration-s`: The duration of AWS STS credentials in seconds.

        For an example, see [S3 as stage](#s3-as-stage).
    #### Databricks DBFS as stage
    Below is a sample for using Databricks DBFS as stage:
    
    ```YAML
    stage:
      type: DATABRICKS_DBFS
      root-dir: "replicate-stage/databricks-stage"
      use-credentials: false
    ```

    #### S3 as stage
    Below is a sample for using S3 as stage:
    
    ```YAML
    stage:
      type: S3
      root-dir: "replicate-stage/s3-stage"
      key-id: "<S3_access key>"
      conn-url: "replicate-stage"
      secret-key: "<S3 secret key>"
      assume-role:
        enable: true
        role-arn: "<Role_ARN>"
        session-duration-s: 900
    ```

    #### GCP as stage
    When hosting Target Databricks on Google Cloud Platform (GCP), it's possible to use GCP Storage as the staging area. To use GCP Storage as the staging area, follow the steps below:

    - [Create a service account from the Google Cloud console](https://cloud.google.com/iam/docs/creating-managing-service-accounts?hl=en#creating).
    - Grant your service account the following roles to GCP Storage:
      - **Storage Object Admin** 
      - **Storage Object Creator**
      - **Storage Object Viewer**
    - [Create a key for your service account](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating). Creating a key successfully downloads a service account key file in JSON format. You'll need to provide the absolute path to the key file in the [`stage` section of your Target Databricks connection configuration](#parameters-related-to-stage-configuration). So make sure to store the key file securely. See the sample `stage` configuration below for better understanding how to provide path to the key file.
    - As a last step, you need to provide your Google service account email address to Databricks. For instructions to do so, see [Configure Databricks SQL to use Google service account for data access](https://docs.gcp.databricks.com/sql/user/security/cloud-storage-access.html#step-3-configure-databricks-sql-to-use-the-service-account-for-data-access).

    Below is sample for using GCP as stage:

    ```YAML
    stage:
      type: GCP
      root-dir: '<stage_directory>'
      conn-url: '<gcp_bucket_name>'
      credential-file-path: '<absolute_file_path_to_service_account_key_file>'
    ```
## III. Configure mapper file (optional)
If you want to define data mapping from your source to Databricks AWS, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}) and [Mapper configuration in Databricks]({{< ref "docs/targets/configuration-files/mapper-reference#mapper-configuration-in-databricks" >}}).

## IV. Set up Applier Configuration

1. From `$REPLICANT_HOME`, navigate to the applier configuration file:
    ```BASH
    vi conf/dst/databricks.yaml
    ```
2. The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to realtime mode.

    ### Parameters related to snapshot mode
    For snapshot mode, make the necessary changes as follows:

      ```YAML
      snapshot:
        threads: 16 #Maximum number of threads Replicant should use for writing to the target

        #If bulk-load is used, Replicant will use the native bulk-loading capabilities of the target database
        bulk-load:
          enable: true
          type: FILE
          serialize: true|false #Set to true if you want the generated files to be applied in serial/parallel fashion
      ```
    There are some additional parameters available that you can use in snapshot mode:

    ```YAML
    snapshot:
      enable-optimize-write: true
      enable-auto-compact:  true
      enable-unmanaged-delta-table: false
      unmanaged-delta-table-location:
      init-sk: false
      per-table-config:
        init-sk: false
        shard-key:
        enable-optimize-write: true
        enable-auto-compact: true
        enable-unmanaged-delta-table: false
        unmanaged-delta-table-location:
    ```
    These parameters are specific to Databricks as destination. More details about these parameters are as follows:
    - `enable-optimize-write`: Databricks dynamically optimizes Apache Spark partition sizes based on the actual data, and attempts to write out 128 MB files for each table partition. This is an approximate size and can vary depending on dataset characteristics. 

      *Default: By default, this parameter is set to `true`*.
    - `enable-auto-compact`: After an individual write, Databricks checks if files can be compacted further. If so, it runs an `OPTIMIZE` job to further compact files for partitions that have the most number of small files. The job is run with 128 MB file sizes instead of the 1 GB file size used in the standard `OPTIMIZE`.

      *Default: By default, this parameter is set to `true`*.
    - `enable-unmanaged-delta-table`: An unmanaged table is a Spark SQL table for which Spark manages only the metadata. The data is stored in the path provided by the user. So when you perform `DROP TABLE <example-table>`, Spark removes only the metadata and not the data itself. The data is still present in the path you provided.

      *Default: By default, this parameter is set to `false`*.
    - `unmanaged-delta-table-location`: The path where data for the unmanaged table is to be stored. It can be a Databricks DBFS path (for example `FileStore/tables`), or an S3 path (for example, `s3://replicate-stage/unmanaged-table-data`) where the S3 bucket is accessible to Databricks.
    - `init-sk`: Partition-key on the source table is represented as a shard-key by replicant. By default the target table does not include this sharding information. If `init-sk` is true we add the shard-key/partition key to target table create SQL. Shard-key replication is disabled by default because DML replication with partitioned tables in Databricks is very slow if the partition key has a high distinct count.

      *Default: By default, this parameter is set to `false`*.
    - `per-table-config`: This configuration allows you to specify various properties for target tables on a per table basis.
      - `init-sk`: Partition-key on the source table is represented as a shard-key by replicant. By default, the target table does not include this sharding information. If `init-sk` is true we add the shard-key/partition key to target table create SQL. Shard-key replication is disabled by default because DML replication with partitioned tables in\ databricks is very slow if the partition key has a high distinct count.

        *Default: By default, this parameter is set to `false`*.
      - `shard-key`: Shard key to be used for partitioning the target table.
      - `enable-optimize-write`: Databricks dynamically optimizes Apache Spark partition sizes based on the actual data, and attempts to write out 128 MB files for each table partition. This is an approximate size and can vary depending on dataset characteristics.

        *Default: By default, this parameter is set to `true`*.
      - `enable-auto-compact`: After an individual write, Databricks checks if files can be compacted further. If so, it runs an `OPTIMIZE` job to further compact files for partitions that have the most number of small files. The job is run with 128 MB file sizes instead of the 1 GB file size used in the standard `OPTIMIZE`.

        *Default: By default, this parameter is set to `true`*.
      - `enable-unmanaged-delta-table`: An unmanaged table is a Spark SQL table for which Spark manages only the metadata. The data is stored in the path provided by the user. So when you perform `DROP TABLE <example-table>`, Spark removes only the metadata and not the data itself. The data is still present in the path you provided.

        *Default: By default, this parameter is set to `false`*.

      - `unmanaged-delta-table-location`: The path where data for the unmanaged table is to be stored. It can be a Databricks DBFS path (for example `FileStore/tables`), or an S3 path (for example, `s3://replicate-stage/unmanaged-table-data`) where the S3 bucket is accessible to Databricks.

    ### Parameters related to realtime mode
    If you want to operate in realtime mode, you can use the `realtime` section to specify your configuration. For example:

    ```YAML
    realtime:
      threads: 4

      txn-size-rows: 100000
      _traceDBTasks: true
      skip-tables-on-failures : false
      enable-dependency-tracking: true
      
      reuse-temp-table: true
    ```

    #### Additional parameters
    <dl class="dl-indent">
    <dt><code>reuse-temp-table</code></dt>
    <dd>

    `true` or `false`.

    Enables reusing temporary tables instead of creating and dropping each time the Applier ingests CDC operations.

    The Applier creates temporary table using target table schema to ingest CDC operations to target table. Creating and dropping temporary tables on each CDC replay may slow down CDC ingestion. Enabling this parameter allows you to make CDC ingestion faster by telling the Applier to reuse the temporary tables.

    _Default: `true`._
    </dd>
    <dt><code>parallel-transaction</code></dt>
    <dd>

    This configuration enables parallel batch processing. Parallel batch processing processes large transactions by splitting them into multiple batches and processing the batches concurrently. This speeds up real-time replication for large transactions and improves overall performance. This feature is available for both Legacy Databricks and Unity Catalog.

    The following configuration options are available:

    | Option | Value | Details |
    |--------|-------|---------|
    |`enable`| Boolean. {`true`\|`false`}. | Enables parallel batch processing. <p>_Default: `true` when [`txn-size-rows`]({{< relref "../../configuration-files/applier-reference#txn-size-rows-1" >}}) is greater than or equal to `2_000_000`._</p>|
    |`txn-rows-threshold`|Integer|Sets the threshold limit for a transaction to qualify for splitting. If transaction size hits this threshold limit, the Applier thread splits the transaction into multiple batches for parallel processing. <p>_Default: `1_000_000`._</p>|
    |`max-chunks-per-table`|Integer|Sets the number of batches to split a transaction into for parallel processing.<p>_Default: `5`._</p>|
    |`threads`|Integer|Sets the number of threads responsible for parallel batch processing. For example, if the maximum number of chunks for each table is `5` and `threads` is set to `10`, then the Applier processes only two transactions concurrently at a time. If new transactions come simultaneously, then the main Applier threads process them serially in one batch.<p>_Default: The number of available processors to JVM._</p>|

    </dd>
    </dl>
    
    ### Enable Type-2 CDC
    From version 22.07.19.3 onwards, Arcion supports Type-2 CDC for Databricks as the target. For more information, see [Type-2 CDC]({{< ref "docs/references/type-2-cdc" >}}) and [`cdc-metadata-type`]({{< ref "docs/targets/configuration-files/applier-reference#cdc-metadata-type" >}}).

  For a detailed explanation of configuration parameters in the Applier file, see [Applier Reference]({{< ref "/docs/targets/configuration-files" >}} "Applier Reference").

## Databricks Unity Catalog Support (Beta)

{{< hint "info" >}}**Note:** This feature is in beta. {{< /hint >}}

From version 22.08.31.3 onwards, Arcion has added support for [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog). The support is still in beta phase, with complete support to land gradually in future releases.

As of now, note the following about the state of Arcion's Unity Catalog support:

- Legacy Databricks only supports two-level namespace:

    - Schemas
    - Tables

  With introduction of Unity Catalog, Databricks now exposes a [three-level namespace](https://docs.databricks.com/data-governance/unity-catalog/queries.html#three-level-namespace-notation) that organizes data. 
    - Catalogs 
    - Schemas 
    - Tables

  Arcion adds support for Unity Catalog by introducing a new child storage type (`DATABRICKS_LAKEHOUSE` child of `DATABRICKS_DELTALAKE`).
- If you're using Unity Catalog, notice the following when configuring your Target Databricks with Arcion:
  - Set the connection `type` to `DATABRICKS_LAKEHOUSE` in the [connection configuration file](#ii-set-up-connection-configuration).
  - To avoid manual steps to configure staging, Databricks has introduced personal staging. To read the staging URL, we've added a new configuration parameter `UNITY_CATALOG_PERSONAL_STAGE`. The complete `stage` configuration is as follows:
    ```YAML
    stage:
      type: UNITY_CATALOG_PERSONAL_STAGE
      staging-url: STAGING_URL
      file-format: DATA_FILE_FORMAT
    ```
    Replace the following:
      - *`STAGING_URL`*: the temporary staging URL—for example, `stage://tmp/userName/rootDir`.
      - *`DATA_FILE_FORMAT`*: the type of data file format. Supported formats are `PARQUET` and `CSV`.
        
        *Default: `PARQUET`*.
- We use `SparkJDBC42` driver for Legacy Databricks (`DATABRICKS_DELTALAKE`) and `DatabricksJDBC42` for Unity catalog (`DATABRICKS_LAKEHOUSE`). For instructions on how to obtain these drivers, see [Obtain the JDBC Driver for Databricks](#i-obtain-the-jdbc-driver-for-databricks).
- Replicant supports Unity Catalog on AWS and Azure platforms.
- To configure [Mapper file]({{< ref "docs/targets/configuration-files/mapper-reference" >}}) in Unity Catalog, see [Mapping in Unity Catalog]({{< ref "docs/targets/configuration-files/mapper-reference#mapping-in-unity-catalog" >}}).