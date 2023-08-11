---
pageTitle: Cloud SQL for MySQL connector by Arcion  
title: MySQL
description: "Get fast data ingestion into Google's Cloud SQL for MySQL with Arcion's dedicated connector."
url: docs/target-setup/cloudsql-for-mysql
bookHidden: false
---

# Destination Cloud SQL for MySQL
This page describes how to load data in real time into [Google's Cloud SQL for MySQL](https://cloud.google.com/sql/mysql), a fully managed service for MySQL relational database.

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/#ii-download-replicant-and-create-a-home-repository" >}}) download as the `$REPLICANT_HOME` directory.

## Prerequisites
Pay attention to the following before configuring MySQL as the Target system:

- To replicate tables into the catalogs or schemas you need, make sure that the specified user possesses the `CREATE TABLE` and `CREATE TEMPORARY TABLE` privileges on those catalogs and schemas.
- If you want Replicant to create catalogs or schemas for you on the target Cloud SQL for MySQL system, then you must grant `CREATE DATABASE` or `CREATE SCHEMA` privileges respectively to the user.
- If the user does not have `CREATE DATABASE` privilege, the follow these steps:
    1. Create a database manually with name `io_blitzz`.
    2. Grant all privileges for the `io_blitzz` database to that user. 
    
    Replicant uses this `io_blitzz` database to maintain internal checkpoints and metadata.

## I. Set up connection configuration
Specify your connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `cloudsql_mysql.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

Specify the connection details in the following manner:

```YAML
type: CLOUDSQL_MYSQL

host: CLOUDSQL_MYSQL_IP
port: PORT_NUMBER

username: 'USERNAME'
password: 'PASSWORD'

max-connections: 30
max-retries: 10
retry-wait-duration-ms: 1000
```

Replace the following:

- *`CLOUDSQL_MYSQL_IP`*: the IP address of the Cloud SQL for MySQL instance
- *`PORT_NUMBER`*: the port number
- *`USERNAME`*: the username of the *`DATABASE_NAME`* user 
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in Cloud SQL instance
- *`max-retries`*: number of times Replicant retries a failed operation
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.

The following shows a sample connnection configuration:

```YAML
type: CLOUDSQL_MYSQL

host: 12.34.456.78
port: 57565

username: "replicant"
password: "Replicant#123"

max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000
```

## II. Configure mapper file (optional)
If you want to define data mapping from your source to Cloud SQL for MySQL, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}).

For example, the following sample applies to a MySQL-to-Cloud SQL for MySQL pipeline:

```YAML
rules:
  [tpch]:
    source:
    - tpch
    tables:
      DST_PART:
        source:
          [tpch, PART]:
      DST_ORDERS:
        source:
          [tpch, ORDERS]:
```

## III. Configure metadata (optional)
To ensure fault tolerance and resilience in replication, Arcion Replicant needs to maintain a number of metadata tables. Replicant uses a metadata configuration file to handle metadata-related operations. For more information, see [Metadata configuration]({{< ref "docs/references/metadata-reference" >}}).

The following shows a sample metadata configuration:

```YAML
type: MYSQL

connection:
  host: localhost
  port: 53585

  username: 'replicant'
  password: 'Replicant#123'
  max-connections: 30


catalog: io_replicate
```

## IV. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `cloudsql_mysql.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

### Configure `snapshot` mode
For operating in [`snapshot` mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the configuration file. For example:

```YAML
snapshot:
  threads: 32
  batch-size-rows: 10_000
  txn-size-rows: 1_000_000

  bulk-load:
    enable: true
    type: FILE

  skip-tables-on-failures : true
  _traceDBTasks: true
  handle-failed-opers: true
  use-upsert-based-recovery: false
  fk-cycle-resolution-method: REMOVE_FK   # BLOCK_TABLES to break cycle or REMOVE_FK(default) to remove constraint

  user-role:
    init-user-roles: true
```

{{< hint "info" >}}
**Tip:** If you want to use bulk loading, make sure to set [the `local_infile` database flag](https://cloud.google.com/sql/docs/mysql/flags#mysql-l) to `on` in Cloud SQL for MySQL.
{{< /hint >}}

For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "docs/targets/configuration-files/applier-reference#snapshot-mode" >}}).

### Configure real-time replication
For operating in [`realtime` mode]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}) or [`full` mode]({{< ref "docs/running-replicant#replicant-full-mode" >}}), specify your configuration under the `realtime` section of the conifiguration file. For example:

```YAML
realtime:
  threads: 32
  batch-size-rows: 10_000
  txn-size-rows: 1_00_000
  replay-replace-as-upsert: false
  skip-tables-on-failures : false
  handle-failed-opers: true

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
