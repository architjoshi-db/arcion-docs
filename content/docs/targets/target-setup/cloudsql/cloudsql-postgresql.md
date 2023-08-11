---
pageTitle: Cloud SQL for PostgreSQL connector by Arcion  
title: PostgreSQL
description: "Get fast data ingestion into Google's Cloud SQL for PostgreSQL with Arcion's dedicated connector."
url: docs/target-setup/cloudsql/cloudsql-for-postgresql
bookHidden: false
---

# Destination Cloud SQL for PostgreSQL
This page describes how to load data in real time into [Google's Cloud SQL for PostgreSQL](https://cloud.google.com/sql/postgresql), a fully managed service for PostgreSQL relational database.

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/#ii-download-replicant-and-create-a-home-repository" >}}) download as the `$REPLICANT_HOME` directory.

## Required permissions
- Make sure that the user being used for replication, has the `CREATE TABLE` privilege on the target catalogs or schemas where you want to replicate the tables to. Use the following command to grant the privileges:
    ```SQL
    GRANT CREATE ON DATABASE <catalog_name> TO <replication_user>;
    ```
    Replace the following: 
    - *`catalog_name`*: the catalog name in the target
    - *`replication_user`*: the user being used for replication 
- In order to store Arcion’s replication metadata, you must ensure one of the following: 
    - Point to an external metadata database. For more information, see [Metadata configuration]({{< ref "docs/references/metadata-reference" >}}).
    - Grant the `CREATEDB` privilege to the user being used for replication. This allows the user to create the `io` database. The user must also possess the privilege to create tables in the `io` database.   Replicant uses this `io` database to maintain internal checkpoint and metadata.

    The following command assigns the `CREATEDB` privilege to a user `alex`:
    ```SQL
    ALTER USER alex CREATEDB;
    ```
    If the user does not have `CREATEDB` privilege, then follow these two steps:
    1. Create a database manually with the name `io`:
        ```SQL
        CREATE DATABASE io;
        ```
    2. Grant all privileges for the `io` database to that user:
        ```SQL
        GRANT ALL ON DATABASE io TO alex;
        ```

## I. Set up connection configuration
Specify your connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `cloudsql_postgresql.yaml` in the `$REPLICANT_HOME/conf/conn` directory. 

Specify the connection details in the following manner:

```YAML
type: CLOUDSQL_POSTGRESQL

host: CLOUDSQL_POSTGRESQL_IP
port: PORT_NUMBER

database: 'DATABASE_NAME'
username: 'USERNAME'
password: 'PASSWORD'

max-connections: 30
max-retries: 10
retry-wait-duration-ms: 1000
socket-timeout-s: 60 #The timeout value used for socket read operations. The timeout is specified in seconds and a value of zero means that it is disabled.
```

Replace the following:

- *`CLOUDSQL_POSTGRESQL_IP`*: the IP address of the Cloud SQL for PostgreSQL instance
- *`PORT_NUMBER`*: the port number
- *`DATABASE_NAME`*: the database name
- *`USERNAME`*: the username of the *`DATABASE_NAME`* user 
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in Cloud SQL instance
- *`max-retries`*: number of times Replicant retries a failed operation
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads.

{{< hint "warning" >}}
**Important:** Make sure that the [`max_connections` in Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres/quotas#maximum_concurrent_connections) is greater than the `max-connections` in the preceding connection configuration file.
{{< /hint >}}

The following demonstrates a sample connnection configuration:

```YAML
type: CLOUDSQL_POSTGRESQL

host: 12.34.456.78
port: 5444

database: 'tpch'
username: 'replicate'
password: 'Replicate#123'

max-connections: 30
max-retries: 10
retry-wait-duration-ms: 1000
socket-timeout-s: 60
```

## II. Configure mapper file (optional)
If you want to define data mapping from your source to Cloud SQL for PostgreSQL, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}).

For example, the following sample applies to a PostgreSQL-to-Cloud SQL for PostgreSQL pipeline:

```YAML
rules:
  [tpch, public]:
    source:
    - [tpch, public]
```

## III. Configure metadata (optional)
To ensure fault tolerance and resilience in replication, Arcion Replicant needs to maintain a number of metadata tables. Replicant uses a metadata configuration file to handle metadata-related operations. For more information, see [Metadata configuration]({{< ref "docs/references/metadata-reference" >}}).

The following shows a sample metadata configuration:

```YAML
type: CLOUDSQL_POSTGRESQL

connection:
    host: localhost
    port: 5435
    database: 'tpch'
    username: 'replicant'
    password: 'Replicant#123'
    max-connections: 30

catalog: 'io'
schema: 'replicate'
```

## IV. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `cloudsql_postgresql.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

### Configure `snapshot` mode
For operating in [`snapshot` mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the configuration file. For example:

```YAML
snapshot:
  threads: 16
  batch-size-rows: 5_000
  txn-size-rows: 1_000_000
  skip-tables-on-failures : false

  bulk-load:
    enable: true
    type: FILE

  _traceDBTasks: true
  use-quoted-identifiers: true
  use-upsert-based-recovery: false
```

For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "docs/targets/configuration-files/applier-reference#snapshot-mode" >}}).

### Configure real-time replication
For operating in [`realtime` mode]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}) or [`full` mode]({{< ref "docs/running-replicant#replicant-full-mode" >}}), specify your configuration under the `realtime` section of the conifiguration file. For example:

```YAML
realtime:
  threads: 8
  txn-size-rows: 10000
  batch-size-rows: 1000
  skip-tables-on-failures : false
  replay-replace-as-upsert: false

  use-quoted-identifiers: true

# Transactional mode config
# realtime:
#   threads: 1
#   batch-size-rows: 1000
#   replay-consistency: GLOBAL
#   txn-group-count: 100
#   _oper-queue-size-rows: 20000
#   skip-upto-cursors: #last failed cursor
```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "docs/targets/configuration-files/applier-reference#realtime-mode" >}}).
