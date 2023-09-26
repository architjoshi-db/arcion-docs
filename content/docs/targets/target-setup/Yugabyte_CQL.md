---
pageTitle: Documentation for YugabyteCQL Target connector
title: YugabyteCQL
description: "Learn everything you need to know for setting up YugabyteCQL as data Target for your data pipelines using Arcion Yugabyte connector."
url: docs/target-setup/yugabyte_cql
bookHidden: false
---
# Destination YugabyteCQL

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample YugabyteSQL connection configuration file:
    ```BASH
    vi conf/conn/yugabytecql.yaml
    ```
2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form using the following format:

    ```YAML
    type: YUGABYTE_CQL

    #You can specify multiple Cassandra nodes using the format below:
    cassandra-nodes:
      NODE_NAME:
        host: NODE_HOST
        port: PORT_NUMBER
    
    username: USERNAME
    password: PASSWORD

    max-connections: MAX_NUMBER_OF_CONNECTIONS 
    ```

    Replace the following:

    - *`NODE_NAME`*: the node name
    - *`NODE_HOST`*: the node host
    - *`PORT_NUMBER`*: the port number in *`NODE_HOST`*
    - *`USERNAME`*: the username that connects to the Cassandra server
    - *`PASSWORD`*: the password associated with *`USERNAME`*
    - *`MAX_NUMBER_OF_CONNECTIONS`*: the maximum number of connections replicant can open in YugabyteCQL

    You can also configure the [read consistency levels](https://docs.datastax.com/en/cassandra-oss/3.0/cassandra/dml/dmlConfigConsistency.html#Readconsistencylevels) and [write consistency levels](https://docs.datastax.com/en/cassandra-oss/3.0/cassandra/dml/dmlConfigConsistency.html#Writeconsistencylevels) by setting the following two parameters in the connection configuration file:

    - `read-consistency-level`
    - `write-consistency-level`

    The following consistency levels are supported:

     - `ANY`
     - `ONE`
     - `TWO`
     - `THREE`
     - `QUORUM`
     - `ALL`
     - `LOCAL_QUORUM `
     - `EACH_QUORUM`
     - `SERIAL`
     - `LOCAL_SERIAL`
     - `LOCAL_ONE`

    *Default: `LOCAL_QUORUM`.*

    The following is a sample connection configuration file:

    ```YAML
    type: YUGABYTE_CQL

    cassandra-nodes:
      node1:
        host: 172.17.0.2
        port: 9042
      node2: 
        host: 172.17.0.3 
        port: 9043

    username: 'alex'
    password: 'alex#123'

    read-consistency-level: LOCAL_QUORUM 
    write-consistency-level: LOCAL_QUORUM

    max-connections: 30
    ```

## II. Set up Applier Configuration
To configure replication according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `yugabytecql.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

For more information on running Replicant in different modes, see [Running Replicant]({{< ref "docs/running-replicant" >}}).

You can configure YugabyteCQL for operating in either snapshot or realtime modes:

### Configure `snapshot` mode
For operating in snapshot mode, specify your configuration under the `snapshot` section of the conifiguration file. For example:

```YAML
snapshot:
  threads: 16
  txn-size-rows: 65_000
  skip-tables-on-failures : false

  keyspaces:
    testdb:
      replication-property: "{'class' : 'SimpleStrategy', 'replication_factor' : 1}"
      durable-writes: true
      enable-cdc: false
```

Notice that you need to specify [the namespace configuration](https://docs.datastax.com/en/cql-oss/3.3/cql/cql_reference/cqlCreateKeyspace.html) under `keyspaces`. It follows this format:

```YAML
keyspaces:
  KEYSPACE_NAME:                                   
    replication-property: "REPLICATION_PROPERTIES"  
    durable-writes: {true|false}
    enable-cdc: {true|false}
```

In the preceding format:

- *`KEYSPACE_NAME`*: The keyspace name.
- *`REPLICATION_PROPERTIES`*: The replication strategy. Corresponds to `REPLICATION` in the [CREATE KEYSPACE docs](https://docs.datastax.com/en/cql-oss/3.3/cql/cql_reference/cqlCreateKeyspace.html).
- `durable-writes`: Corresponds to `DURABLE_WRITES` in the [CREATE KEYSPACE docs](https://docs.datastax.com/en/cql-oss/3.3/cql/cql_reference/cqlCreateKeyspace.html).
- `enable-cdc`: Corresponds to `cdc` in the [CREATE TABLE docs](https://docs.datastax.com/en/cql-oss/3.3/cql/cql_reference/cqlCreateTable.html#cqlCreateTable).

#### Use bulk loading
If you want to use bulk loading in snapshot mode, use [the `bulk-load` section]({{< relref "../configuration-files/applier-reference#bulk-load" >}}) to specify your configuration. For example:

```YAML
snapshot:
  threads: 16
  txn-size-rows: 65_000
  skip-tables-on-failures : false

  bulk-load:
    enable: true
    type: FILE
```

{{< hint "info" >}}
**Note:** For YugabyteCQL, only `FILE` type bulk loading is supported.
{{< /hint >}}

### Configure `realtime` mode
For operating in realtime mode, specify your configuration under the `realtime` section of the conifiguration file. For example:

```YAML
realtime:
  txn-size-rows: 65_000
  skip-tables-on-failures : false
```

For a detailed explanation of configuration parameters in the Applier file, see [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").
