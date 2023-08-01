---
pageTitle: Google AlloyDB connector by Arcion
title: AlloyDB
description: "Arcion's dedicated connector offers fast data ingestion to Google's AlloyDB, a fully managed PostgreSQL-compatible database service."
url: docs/target-setup/alloydb
bookHidden: false
---

# Destination AlloyDB
This page describes how to load data in real time into [Google's AlloyDB](https://cloud.google.com/alloydb), a fully managed PostgreSQL-compatible database service.

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/#ii-download-replicant-and-create-a-home-repository" >}}) as the `$REPLICANT_HOME` directory.

## I. Set up connection configuration
Specify your AlloyDB connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `alloydb.yaml` in the `$REPLICANT_HOME/conf/conn` directory. 

Specify the connection details in the following manner:

```YAML
type: ALLOYDB

host: ALLOYDB_IP
port: PORT_NUMBER

database: 'DATABASE_NAME'
username: 'USERNAME'
password: 'PASSWORD'

max-connections: 30
max-retries: 10
retry-wait-duration-ms: 1000
socket-timeout-s: 60 
```

Replace the following:

- *`ALLOYDB_IP`*: the IP address of the AlloyDB instance
- *`PORT_NUMBER`*: the port number
- *`DATABASE_NAME`*: the AlloyDB database name
- *`USERNAME`*: the username of the *`DATABASE_NAME`* user 
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in AlloyDB
- *`max-retries`*: number of times Replicant retries a failed operation
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads.

The following demonstrates a sample connnection configuration:

```YAML
type: ALLOYDB

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
If you want to define data mapping from your source to AlloyDB, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}).

For example, the following sample applies to a PostgreSQL-to-AlloyDB pipeline:

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
type: ALLOYDB

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
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `alloydb.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

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

For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure `realtime` mode
For operating in [`realtime` mode]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}), specify your configuration under the `realtime` section of the conifiguration file. For example:

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

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "../configuration-files/applier-reference#realtime-mode" >}}).
