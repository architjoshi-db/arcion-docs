---
pageTitle: Google BigQuery Target Connector Documentation
title: Setup guide
description: "Load terabyte-scale data into BigQuery. Build real-time data streams for real-time analytics and accelerate your business with Arcion BigQuery connector."
bookHidden: false
weight: 1
url: docs/target-setup/bigquery/setup-guide
---

# Setup guide for Google BigQuery target

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the following steps.

## I. Obtain the JDBC driver for Google BigQuery

Replicant requires the JDBC driver for Google BigQuery as a dependency. To obtain the appropriate driver, follow these steps: 

- Go to the [JDBC drivers for BigQuery page](https://cloud.google.com/bigquery/docs/reference/odbc-jdbc-drivers#current_jdbc_driver).
- From there, download the [latest JDBC 4.2-compatible JDBC driver ZIP](https://storage.googleapis.com/simba-bq-release/jdbc/SimbaJDBCDriverforGoogleBigQuery42_1.2.25.1029.zip).
- From the downloaded ZIP, locate and extract the `GoogleBigQueryJDBC42.jar` file.
- Put the `GoogleBigQueryJDBC42.jar` file inside `$REPLICANT_HOME/lib` directory.

## II. Required permissions
To load data into BigQuery, you need to make sure you have the necessary IAM permissions. These permissions are required to run a load job and load data into BigQuery tables and partitions. For more information about these permissions, see [Permissions to load data into BigQuery](https://cloud.google.com/bigquery/docs/loading-data-cloud-storage-csv#required_permissions).

## III. Set up connection configuration
Specify our BigQuery connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `bigquery.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

### Configure BigQuery server connection
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
Otherwise, you can put your credentials like usernames and passwords in plain form like the following sample:

```YAML
type: BIGQUERY

host: https://www.googleapis.com/bigquery/v2
port: 443
project-id: bigquerytest-268904
auth-type: 0
o-auth-service-acc-email: bigquerytest@bigquerytest-268904.iam.gserviceaccount.com
o-auth-pvt-key-path: <path_to_oauth_private_key>
location: US
timeout: 500

username: "xxx"
password: "xxxx"

max-connections: 20

max-retries: 10
retry-wait-duration-ms: 1000
```

Arcion supports both HTTP and HTTPS for BigQuery connection. 
{{< tabs "using-http-https-in-bigquery-target-connection" >}}
{{< tab "Use HTTP" >}}
To use HTTP, follow these steps:

- Set `http` as the protocol in the `host` URL. 
- Set `port` to `80`.
{{< /tab >}}

{{< tab "Use HTTPS" >}}
To use HTTPS, follow these steps:

- Set `https` as the protocol in the `host` URL. 
- Set `port` to `443`.

{{< /tab >}}
{{< /tabs >}}

### Configure stage
Arcion supports CSV and [Parquet](http://parquet.apache.org/) as intermediatary formats to send data to the BigQuery server. To specify the stage format, use the `stage` field in the connection configuration file:

```YAML
stage:
  type: NATIVE
  file-format: {CSV|PARQUET}
```
## IV. Set up Applier configuration
To configure replication according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `bigquery.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

Arcion Replicant supports the following modes of replication for BigQuery target:

- `snapshot`
- `realtime`
- `full`

For more information about different Replicant modes, see [Running Replicant]({{< ref "../../../running-replicant" >}}).

For a detailed explanation of configuration parameters in the Applier file, see [Applier Reference]({{< ref "../../configuration-files/applier-reference" >}}).

### Configure `snapshot` replication
For [`snapshot`]({{< ref "../../../running-replicant#replicant-snapshot-mode" >}}) replication, Replicant supports the following two methods:

- [Loading data with conventional load job method]({{< relref "replication-methods#load-data-with-load-job-method" >}}) (Default method).
- [Streaming data using BigQuery Storage Write API]({{< relref "replication-methods#load-data-using-the-storage-write-api" >}}).

#### Sample configuration with load job method

```YAML
snapshot:
  threads: 16

  batch-size-rows: 100_000_000
  txn-size-rows: 1_000_000_000
  
  use-write-storage-api: false

  bulk-load:
    enable: true
    type: FILE
    save-file-on-error: true
    serialize: true

  use-quoted-identifiers: false
```

#### Sample configuration with Storage Write API

```YAML
snapshot:
  threads: 16

  batch-size-rows: 100_000_000
  txn-size-rows: 1_000_000_000
  
  use-write-storage-api: true

  bulk-load:
    enable: true
    type: FILE
    save-file-on-error: true
    serialize: true
```

For more information about the configuration parameters for snapshot mode, see [Snapshot Mode]({{< ref "../../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure `realtime` replication
For [`realtime`]({{< ref "../../../running-replicant#replicant-realtime-mode" >}}) replication, Replicant supports the following two methods:

- [Loading data with conventional load job method]({{< relref "replication-methods#load-data-with-load-job-method" >}}) (Default method).
- [Streaming data using BigQuery Storage Write API]({{< relref "replication-methods#load-data-using-the-storage-write-api" >}}).

#### Sample configuration with load job method

```YAML
realtime:
  threads: 16
    _traceDBTasks: true
    skip-tables-on-failures : false
    replay-strategy: IN_MEMORY_MERGE
    per-table-config:
      - catalog: tpch_scale_0_01
        tables:
          nation:
            replay-strategy: MERGE
            enable-dependency-tracking: false
          region:
            replay-strategy: INSERT_MERGE
            enable-dependency-tracking: true
```

#### Sample configuration with Storage Write API

```YAML
realtime:
  threads: 16
  _traceDBTasks: true
  skip-tables-on-failures : false

  use-write-storage-api: true

  replay-strategy: IN_MEMORY_MERGE
  per-table-config:
    - catalog: tpch_scale_0_01
      tables:
        nation:
          replay-strategy: MERGE
          enable-dependency-tracking: false
        region:
          replay-strategy: INSERT_MERGE
          enable-dependency-tracking: true
```

For more information about the configuration parameters for realtime mode, see [Realtime Mode]({{< ref "../../configuration-files/applier-reference#realtime-mode" >}}).

#### Replay strategies
Arcion uses replay strategies to implement CDC changes and apply the changes in realtime to the target. You can specify a replay strategy by setting the `replay-strategy` parameter as you can see in the preceding samples. Arcion supports the following replay strategies:

- `NONE`
- `INSERT_DELETE`
- `INSERT_MERGE`
- `IN_MEMORY_MERGE`
