---
pageTitle: Documentation for Databricks Source connector
title: Databricks Delta Lake
description: "Arcion offers fast, reliable, and real-time data ingestion for Databricks Lakehouse, supporting bleeding-edge features like Unity Catalog."
url: docs/source-setup/databricks
bookHidden: true
bookSearchExclude: true
---
# Source Databricks Delta Lake

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

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

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: DATABRICKS_DELTALAKE

    host: "HOSTNAME"
    port: "PORT_NUMBER"

    url: "jdbc:databricks://HOST:PORT/DATABASE_NAME;transportMode=http;ssl=1;httpPath=<http-path>;AuthMech=3" # This URL can be copied from databricks cluster info page"

    username: "USERNAME"

    password: "PASSWORD"

    max-connections: 30

    max-retries: 100
    retry-wait-duration-ms: 1000
    ```

    Replace the following:
    - *`HOSTNAME`*: the hostname of your Databricks host
    - *`PORT_NUMBER`*: the port number of the Databricks cluster
    - *`USERNAME`*: a valid username that connects to your Databricks server. If you're using [personal access tokens for authentication](https://docs.databricks.com/dev-tools/api/latest/authentication.html#generate-a-personal-access-token), set this parameter to `token`.
    - *`PASSWORD`*: the password associated with *`USERNAME`*. If you're using [personal access tokens for authentication](https://docs.databricks.com/dev-tools/api/latest/authentication.html#generate-a-personal-access-token), set this parameter to the value of your token—for example, `fapi1234567890ab1cde1f3ab456c7d89efa`.
    
    {{< hint "warning" >}} **Important:** For [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog), set the connection `type` to `DATABRICKS_LAKEHOUSE`. To know more, see [Databricks Unity Catalog Support](#databricks-unity-catalog-support-beta).{{< /hint >}}

## III. Set up Extractor Configuration
    
The Extractor configuration file has two parts:

  - Parameters related to snapshot mode.
  - Parameters related to realtime mode.

  ### Parameters related to snapshot mode
  For snapshot mode, make the necessary changes as follows:

  ```YAML
  snapshot:
    threads: 16
    fetch-size-rows: 5_000 #Maximum number of records/documents fetched by replicant at once from the source system
    min-job-size-rows: 1_000_000 #tables/collections are chunked into multiple jobs for replication. This configuration specifies a minimum size for each such job. This has a positive correlation with the memory footprint of replicant
    max-jobs-per-chunk: 32 #Determines the maximum number of jobs created per source table/collection
    _traceDBTasks: true

    per-table-config:
    - catalog: io_blitzz
      tables:
        orders:
          num-jobs: 10 #Number of parallel jobs that will be used to extract the rows from a table. This value will override the number of jobs internally calculated by Replicant
          split-key: ORDERKEY #This configuration is used by replicant to split a table into multiple jobs in order to do parallel extraction. This column will be used to perform parallel data extraction from table being replicated that has this column
        lineitem:
          split-key: orderkey
  ```

  {{< hint "warning" >}} **Important:** For Unity Catalog, specify both both `catalog` and `schema` in `per-table-config`.{{< /hint >}}

  ### Parameters related to realtime mode
  If you want to operate in realtime mode, you can use the `realtime` section to specify your configuration. For example:

  ```YAML
  realtime:
    threads: 16
    fetch-size-rows: 5_000
    _traceDBTasks: true
  ```

For a detailed explanation of configuration parameters in the Extractor file, see [Extractor Reference]({{< ref "../configuration-files/Extractor-reference" >}} "Extractor Reference").

## IV. Set up Filter configuration (Optional)

1. From `$REPLICANT_HOME`, navigate to the sample Filter configuration file:

    ```BASH
    vi filter/databricks.yaml
    ```

2. The sample contains the following:

    ```YAML
    allow:
    - catalog: "tpch"
      types: [TABLE]
      allow:
        nation:
        region:
    ```

    {{< hint "warning" >}} **Important:** For Unity Catalog, specify both both `catalog` and `schema` under the list `allow`. {{< /hint >}}

For a detailed explanation of configuration parameters in the Filter file, see [Filter Reference]({{< ref "../configuration-files/filter-reference" >}} "Extractor Reference").


## Databricks Unity Catalog Support (Beta)

{{< hint "info" >}}**Note:** This feature is currently in beta. {{< /hint >}}

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
- If you're using Unity Catalog, notice the following when configuring your Source Databricks with Arcion:
  - Set the connection `type` to `DATABRICKS_LAKEHOUSE` in the [connection configuration file](#ii-set-up-connection-configuration).
  - Specify both both `catalog` and `schema` as part of `per-table-config` [in the Extractor configuration file](#iii-set-up-extractor-configuration).
  - If you want to configure [Filter](../configuration-files/filter-reference) on your Source Databricks, specify both both `catalog` and `schema` under the list `allow` in the [Filter configuration file](#iv-set-up-filter-configuration-optional).
- We'll be using `SparkJDBC42` driver for Legacy Databricks (`DATABRICKS_DELTALAKE`) and `DatabricksJDBC42` for Unity catalog (`DATABRICKS_LAKEHOUSE`). For instructions on how to obtain these drivers, see [Obtain the JDBC Driver for Databricks](#i-obtain-the-jdbc-driver-for-databricks).
- Replicant currently supports Unity Catalog on AWS and AZURE.


