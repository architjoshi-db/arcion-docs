---
pageTitle: Documentation for Databricks Target on Azure
title: Databricks on Azure
description: "Set up Arcion with Databricks on Azure. Leverage Azure Data Lake Storage as stage, Type-2 CDC, and Databricks Unity Catalog."
url: docs/target-setup/databricks/databricks-azure
bookHidden: false
---

# Destination Azure Databricks

On this page, you'll find step-by-step instructions on how to set up your Azure Databricks instance as data target with Arcion. The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the following steps.

## Prerequisites

- A Databricks workspace on Azure
- Azure container in ADLS Gen2 (Azure Data Lake Storage Gen2)

To create a storage account, see [Create a storage account to use with Azure Data Lake Storage Gen2](https://learn.microsoft.com/en-us/azure/storage/blobs/create-data-lake-storage-account). To create a container, see [Create a container](https://learn.microsoft.com/en-us/azure/storage/blobs/blob-containers-portal#create-a-container).

## I. Create a Databricks cluster
Arcion supports both Databricks all-purpose cluster and SQL Warehouse. The following sections describe how set up each type of cluster.

### Set up all-purpose cluster
If you want to connect to Databricks all-purpose cluster, follow these instructions:

1. Log in to your Databricks workspace.
2. From the Databricks console, go to **Data Science & Engineering > Compute > Create Compute**.
3. Enter a name for your cluster.
4. Select the latest Databricks runtime version.
5. [Set up an external stage](#iii-configure-adls-container-as-stage).
6. Click **Create Cluster**.

#### Get connection details for a cluster
To establish connection between your Databricks instance and Arcion, you need to provide the connection details for your cluster. You provide these connection details to Replicant using [the connection configuration file](#vi-configure-replicant-connection-for-databricks). To retrieve connection details, follow these steps after you [set up a cluster](#set-up-all-purpose-cluster):

1. Click the **Advanced Options** toggle.
2. Click on the **JDBC/ODBC** tab and take note of the following values:
    - Server Hostname
    - Port
    - JDBC URL

### Set up SQL warehouse
If you want to connect SQL warehouse (SQL Compute), follow these instructions:

1. Log in to your Databricks workspace.
2. From the Databricks console, go to **SQL >  Review SQL warehouses > Create SQL Warehouse**.
3. Enter a name for your SQL warehouse.
4. Choose cluster size.
5. [Set up an external stage](#iii-configure-adls-container-as-stage).
6. Click **Create**.

#### Get connection details for a SQL warehouse
To establish connection between your Databricks instance and Arcion, you need to provide the connection details for your SQL warehouse. You provide these connection details to Replicant using [the connection configuration file](#vi-configure-replicant-connection-for-databricks). To retrieve connection details, follow these steps after you [set up a SQL warehouse](#set-up-sql-warehouse):

1. Navigate to the **Connection Details** tab.
2. Take note of the following values:

    - Server Hostname
    - Port
    - JDBC URL

## II. Create a personal access token for the Databricks cluster
To create a personal access token, see [Generate a personal access token](https://docs.databricks.com/dev-tools/api/latest/authentication.html#token-management) in Databricks documentation. You need this token to configure Arcion Replicant for replication.

## III. Configure ADLS container as stage
To grant Databricks access to ADLS, follow one of the these methods:
- [Access Azure Data Lake Storage Gen2 or Blob Storage using OAuth 2.0 with an Azure service principal](https://docs.databricks.com/storage/azure-storage.html#access-azure-data-lake-storage-gen2-or-blob-storage-using-oauth-20-with-an-azure-service-principal).
- [Access Azure Data Lake Storage Gen2 or Blob Storage using a SAS token](https://docs.databricks.com/storage/azure-storage.html#access-azure-data-lake-storage-gen2-or-blob-storage-using-a-sas-token).
- [Access Azure Data Lake Storage Gen2 or Blob Storage using the account key](https://docs.databricks.com/storage/azure-storage.html#access-azure-data-lake-storage-gen2-or-blob-storage-using-the-account-key).

The preceding resources use Python to grant access. Instead of Python, you can use [Spark configuration properties](https://spark.apache.org/docs/latest/configuration.html) to access data in Azure storage account. 

### Spark configuration for cluster
1. On the cluster configuration page, click the **Advanced Options** toggle.
2. Click the **Spark** tab.
3. In the **Spark Config** textbox, enter your configuration properties.


### Spark configuration for SQL warehouse
1. Click your username in the top bar of Databricks workspace and select **Admin Console** from the dropdown.
2. Click the **SQL Warehouse Settings** tab.
3. In the **Data Access Configuration** textbox, enter your configuration properties.

For example, to access data in Azure storage account using storage account key, enter the following Spark configuration:

```
fs.azure.account.key.STORAGE_ACCOUNT.dfs.core.windows.net STORAGE_ACCOUNT_KEY
``` 

Replace the following:

- *`STORAGE_ACCOUNT`*: your Azure storage account name
- *`STORAGE_ACCOUNT_KEY`*: your storage account key

## IV. Obtain the JDBC Driver for Databricks

Replicant requires the Databricks JDBC Driver as a dependency. To obtain the appropriate driver, follow these steps: 

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

## V. Configure Replicant connection for Databricks
In this step, you need to provide the Databricks connection details to Arcion. To do so, follow these steps:

1. You can find a sample connection configuration file `databricks.yaml` in the `$REPLICANT_HOME/conf/conn/` directory. 

2. The connection configuration file has the following two parts:
     - Parameters related to target Databricks server connection.
     - Parameters related to stage configuration.

    ### Parameters related to target Databricks server connection
    {{< hint "info" >}}
  **Note:** All communications with Databricks happen through port 443, the standard port for HTTPS. So all data is encrypted and secure with SSL by default.
    {{< /hint >}}
    You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). Otherwise, you can put your credentials in plain form like the following sample:

    ```YAML
    type: DATABRICKS_DELTALAKE

    url: "JDBC_URL"
    username: USERNAME
    password: "PASSWORD"
    host: "HOSTNAME"
    port: "PORT_NUMBER"
    max-connections: 30
    ```
    Replace the following:
    - *`JDBC_URL`*: the JDBC URL that you retrieve [from the connection details for a cluster](#get-connection-details-for-a-cluster)
    - *`HOSTNAME`*: the hostname of your Databricks host that you retrieved [from the connection details for a cluster](#get-connection-details-for-a-cluster)
    - *`PORT_NUMBER`*: the port number of the Databricks cluster that you retrieved [from the connection details for a cluster](#get-connection-details-for-a-cluster)
    - *`USERNAME`*: the username that connects to your Databricks server
    - *`PASSWORD`*: the password associated with *`USERNAME`*

    Change the value of `max-connections` as you need. It specifies the maximum number of connections Replicant can open in Databricks. 

    {{< hint "info" >}}For [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog), set the connection `type` to `DATABRICKS_LAKEHOUSE`. For more information, see [Databricks Unity Catalog Support](#databricks-unity-catalog-support).{{< /hint >}}

    ### Parameters related to stage configuration
    You must use an external stage to hold the data files and load that data on the target database from there. The `stage` section contains the details Replicant needs to connect to and use a specific stage. 

      - `type`*[v21.06.14.1]*: The stage type. For Azure Legacy Databricks, set `type` to `AZURE`.
      - `root-dir`: The directory under ADLS container. Replicant uses this directory to stage bulk-load files.
      - `conn-url`*[v21.06.14.1]*: The name of the ADLS container.        
      - `account-name`*[v21.06.14.1]*: The name of the ADLS storage account. `account-name` corresponds to the same storage account in the [Configure ADLS container as stage](#iii-configure-adls-container-as-stage) section.
      - `secret-key`*[v21.06.14.1]*: If you want to authenticate ADLS using a storage account key, specify your storage account key here.
      - `sas-token`: If you use [shared access signature (SAS) token](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview) to authenticate ADLS, specify the SAS token here.
      
      The following illustrates two sample stage configurations for Azure Databricks. One sample specifies storage account key and the other sample specifies SAS token for authentication.

      {{< tabs "sample-stage-config-for-azure-databricks" >}}
      {{< tab "With storage account key" >}}

  ```YAML
  stage:
    type: AZURE
    root-dir: "replicate-stage/databricks-stage"
    conn-url: "replicant-container"
    account-name: "replicant-storageaccount"
    secret-key: "YOUR_STORAGE_ACCOUNT_KEY"
  ```
      {{< /tab >}}
      {{< tab "With SAS token" >}}

  ```YAML
  stage:
    type: AZURE
    root-dir: "replicate-stage/databricks-stage"
    conn-url: "replicant-container"
    account-name: "replicant-storageaccount"
    sas-token: "YOUR_SAS_TOKEN"
  ```
      {{< /tab >}}
      {{< /tabs >}}
## VI. Configure mapper file (optional)
If you want to define data mapping from your source to Azure Databricks, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}) and [Mapper configuration in Databricks]({{< ref "docs/targets/configuration-files/mapper-reference#mapper-configuration-in-databricks" >}}).

## VII. Set up Applier configuration

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
    <dt>
    
    `parallel-transaction` _[v23.06.30.2]_
    </dt>
    <dd>

    This configuration enables parallel batch processing. Parallel batch processing processes large transactions by splitting them into multiple batches and processing the batches concurrently. This speeds up real-time replication for large transactions and improves overall performance. This feature is available for both Legacy Databricks and Unity Catalog.

    The following configuration options are available:

    | Option | Value | Details |
    |--------|-------|---------|
    |`enable`| Boolean. {`true`\|`false`}. | Enables parallel batch processing. <p>_Default: `true` when [`txn-size-rows`]({{< relref "../../configuration-files/applier-reference#txn-size-rows-1" >}}) is greater than or equal to `2_000_000`._</p>|
    |`txn-rows-threshold`|Integer|Sets the threshold limit for a transaction to qualify for splitting. If transaction size hits this threshold limit, the Applier thread splits the transaction into multiple batches for parallel processing. <p>_Default: `1_000_000`._</p>|
    |`max-chunks-per-table`|Integer|Sets the number of batches to split a transaction into for parallel processing.<p>_Default: `5`._</p>|
    |`threads`|Integer|Sets the number of threads responsible for parallel batch processing. For example, if the maximum number of chunks for each table is `5` and `threads` is set to `10`, the Applier processes only two transactions concurrently at a time. If new transactions come simultaneously, the main Applier threads process them serially in one batch.<p>_Default: The number of available processors to JVM._</p>|

    </dd>
    </dl>
    
    ### Enable Type-2 CDC
    From version 22.07.19.3 onwards, Arcion supports Type-2 CDC for Databricks as the target. For more information, see [Type-2 CDC]({{< ref "docs/references/type-2-cdc" >}}) and [`cdc-metadata-type`]({{< ref "docs/targets/configuration-files/applier-reference#cdc-metadata-type" >}}).

  For a detailed explanation of configuration parameters in the Applier file, read [Applier Reference]({{< ref "/docs/targets/configuration-files" >}} "Applier Reference").

## Databricks Unity Catalog support
From version 22.08.31.3 onwards, Arcion supports [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog).

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
  - Set the connection `type` to `DATABRICKS_LAKEHOUSE` in the [connection configuration file](#parameters-related-to-target-databricks-server-connection).
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