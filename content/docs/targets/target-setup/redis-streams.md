---
pageTitle: Documentation for Redis Streams as target 
title: Redis Streams
description: "Get in-depth documentation on how to ingest data into Redis Streams with Arcion, from setting up secure connection to realtime replication."
bookHidden: false
url: docs/target-setup/redis-streams
---

# Destination Redis Streams
This page describes how to load data in realtime into [Redis Streams](https://redis.io/docs/data-types/streams/), an append-only log data structure.

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## I. Set up connection configuration
Specify our Redis connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `redis_stream.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

For connecting to Redis, you can choose between two methods for an authenticated connection:
  - Using basic username and password authentication
  - Using SSL

### Connect with username and password
For connecting to Redis with basic username and password authentication, you can specify your credentials in the connection configuration file. Follow these instructions based on whether or not you have SSL encryption enabled for Redis connection.

{{< tabs "username-pwd-authentication" >}}
{{< tab "Without SSL encryption for connection" >}}
Without SSL encryption for Redis connection, specify your configuration in the following manner:

```YAML
type: REDIS_STREAM

host: HOSTNAME
port: PORT_NUMBER
username: 'USERNAME'
password: 'PASSWORD'

max-connections: 30
max-retries: 10
```

Replace the following:

- *`HOSTNAME`*: the Redis server hostname.
- *`PORT_NUMBER`*: the port number of Redis host
- *`USERNAME`*: the username to connect to the Redis server
- *`PASSWORD`*: the password associated with *`USERNAME`*

In the preceding sample:

- `max-connections` specifies the maximum number of connections Replicant can open in Redis. 
- `max-retries` specifies the number of times any failed operation on the system will be re-attempted.

Feel free to change these two values as you need.
{{< /tab >}}

{{< tab "With SSL encryption for connection" >}}
You can enable data encryption for Redis connection using SSL. In that case, you need to specify the TrustStore holding the CA certificate along with the username and password. For example:

```YAML
type: REDIS_STREAM

host: HOSTNAME
port: PORT_NUMBER

username: 'USERNAME'
password: 'PASSWORD'

ssl:
  enable: true
  trust-store:
    path: "PATH_TO_TRUSTSTORE"
    password: "TRUSTSTORE_PASSWORD"
    ssl-store-type: 'TRUSTSTORE_TYPE'
max-connections: 30
max-retries: 10
```
Replace the following:

- *`HOSTNAME`*: the Redis server hostname.
- *`PORT_NUMBER`*: the port number of Redis host
- *`USERNAME`*: the username to connect to the Redis server
- *`PASSWORD`*: the password associated with *`USERNAME`*
- *`PATH_TO_TRUSTSTORE`*: path to the TrustStore
- *`TRUSTSTORE_PASSWORD`*: the TrustStore password
- *`TRUSTSTORE_TYPE`*: the TrustStore type—for example, `PKCS12`

In the preceding sample:

- `max-connections` specifies the maximum number of connections Replicant can open in Redis. 
- `max-retries` specifies the number of times any failed operation on the system will be re-attempted.

Feel free to change these two values as you need.

{{< /tab >}}
{{< /tabs >}}
### Connect using SSL
If you prefer both client authentication and data encryption using SSL, specify both TrustStore and KeyStore details in the connection configuration file. For example:

```YAML
type: REDIS_STREAM

host: HOSTNAME
port: PORT_NUMBER

ssl:
  enable: true
  trust-store:
    path: "PATH_TO_TRUSTSTORE"
    password: "TRUSTSTORE_PASSWORD"
    ssl-store-type: 'TRUSTSTORE_TYPE'
  key-store:
    path: "PATH_TO_KEYSTORE"
    password: "KEYSTORE_PASSWORD"
    ssl-store-type: 'KEYSTORE_TYPE'

max-connections: 30
max-retries: 10
```

Replace the following:

- *`HOSTNAME`*: the Redis server hostname.
- *`PORT_NUMBER`*: the port number of Redis host
- *`PATH_TO_TRUSTSTORE`*: path to the TrustStore
- *`TRUSTSTORE_PASSWORD`*: the TrustStore password
- *`TRUSTSTORE_TYPE`*: the TrustStore type—for example, `PKCS12`
- *`PATH_TO_KEYSTORE`*: path to the KeyStore
- *`KEYSTORE_PASSWORD`*: the KeyStore password
- *`KEYSTORE_TYPE`*: the KeyStore type—for example, `PKCS12`

  
In the preceding sample:

- `max-connections` specifies the maximum number of connections Replicant can open in Redis. 
- `max-retries` specifies the number of times any failed operation on the system will be re-attempted.

Feel free to change these two values as you need.

## II. Configure mapper file (optional)
If you want to define data mapping from your source to Redis Streams, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}).

When mapping source object names to Redis streams, you can choose between two delimiters for stream names. For more information, see [Delimiter in Kafka topic and Redis stream names]({{< ref "docs/targets/configuration-files/mapper-reference#delimiter-in-kafka-topic-and-redis-stream-names" >}}).

## III. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `redis_stream.yaml` in the `$REPLICANT_HOME/conf/dst` directory. For example:

```YAML
snapshot:
  threads: 16

realtime:
  threads: 16
  split-stream: false
```

For more information on running Replicant in different modes, see [Running Replicant]({{< ref "docs/running-replicant" >}}).

You can configure Redis Streams for operating in either [snapshot](#configure-snapshot-mode) or [realtime](#configure-realtime-mode) modes.

### Configure `snapshot` mode
For operating in snapshot mode, specify your configuration under the `snapshot` section of the conifiguration file. For example:

```YAML
snapshot:
  threads: 32
  batch-size-rows: 10_000
  txn-size-rows: 10_000
```

#### Additional `snapshot` parameters

##### `log-row-level-errors`
`true` or `false`.

During snapshot replication, if a given batch fails, Replicant retries the failed rows. You can set this parameter to `true` if you want to log the failed rows in [the trace.log file]({{< ref "../../references/troubleshooting#the-log-files" >}}).

For more information about the Applier parameters for `snapshot` mode, see [Snapshot Mode]({{< relref "../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure `realtime` mode
For operating in realtime mode, specify your configuration under the `realtime` section of the conifiguration file. For example:

```YAML
realtime:
  threads: 16
  replay-consistency: EVENTUAL
  txn-size-rows: 10_000
  batch-size-rows: 10_000
```

#### Additional `realtime` parameters

##### `split-stream`
`true` or `false`.

Creates a separate stream for snapshot and CDC data if `true`. If `false`, a single stream contains the data for snapshot and CDC. `split-stream` is a global parameter for `realtime` mode. So you can't change it on a per-table basis.

_Default: `true`._

For more information about the configuration parameters for `realtime` mode, see [Realtime Mode]({{< ref "../configuration-files/applier-reference#realtime-mode" >}}).

## Design considerations

### Supported platforms
Arcion Replicant supports the following sources for Redis Streams as target:

 - [Db2 LUW]({{< relref "../../sources/source-setup/db2/db2_native_luw" >}})
 - [Microsoft SQL Server]({{< relref "../../sources/source-setup/sqlserver" >}})
 - [MySQL]({{< relref "../../sources/source-setup/mysql" >}})
 - [Oracle]({{< relref "../../sources/source-setup/oracle" >}})
 - [PostgreSQL]({{< relref "../../sources/source-setup/postgresql" >}})
 - [SAP ASE]({{< relref "../../sources/source-setup/sap_ase" >}})

  For MySQL, you can also enable [Global Transaction ID (GTID) based logging](https://dev.mysql.com/doc/refman/5.7/en/replication-options-gtids.html#sysvar_gtid_mode) and [enforce GTID consistency](https://dev.mysql.com/doc/refman/5.7/en/replication-options-gtids.html#sysvar_enforce_gtid_consistency) if Redis messages require them. To do so, add the following to your MySQL option file `my.cnf`:

  ```cnf
  gtid_mode=ON 
  enforce-gtid-consistency=ON
  ```

### Failures and rollbacks
Redis stream acts like an append log that where each Stream entry has an ID for each message and allows deleting messages with a given Stream entry ID. However, Redis does not support rollback functionality with transactions. So, if some rows in a batch fail, the entire transaction is not rolled back. Due to this behavior, Replicant follows this strategy: 

- For snapshot, Replicant identifies the failed rows in a given batch and retries those failed rows.
- For realtime, since Replicant must maintain the order, Replicant tries to undo the committed rows in a given batch and retries the entire batch.

### Replicant's behavior after reaching `max-retries `
After reaching the maximum number of re-attempts specified in [`max-retries`](#i-set-up-connection-configuration), Replicant's behavior depends on the replication mode and [the type of transactional consistency](#transactional-consistency-in-realtime-mode). 

<dl class="dl-indent">
<dt>During snapshot phase</dt>
<dd>

The [`skip-tables-on-failures` Applier configuration parameter]({{< ref "docs/targets/configuration-files/applier-reference#skip-tables-on-failures" >}}) defaults to `true`. Therefore, Replicant excludes the table from the replication rather than stopping the Replicant process by throwing an exception. This behavior prevents the rest of the tables from going into an inconsistent state. Using the [dynamic reinitialization feature]({{< ref "docs/references/dynamic-reinitialization" >}}), you can add the tables Replicant excludes from replication. 

You can also disable [`skip-tables-on-failures`]({{< ref "docs/targets/configuration-files/applier-reference#skip-tables-on-failures" >}}). In that case, Replicant throws an exception and performs snapshot recovery when you resume replication with [the `--resume` option]({{< ref "docs/running-replicant#various-replication-options-explanation" >}}).

</dd>

<dt>During realtime phase with eventual replay consistency</dt>
<dd>

The [`skip-tables-on-failures` Applier configuration parameter]({{< ref "docs/targets/configuration-files/applier-reference#skip-tables-on-failures" >}}) defaults to `true`. Therefore, Replicant excludes the table from the replication rather than stopping the Replicant process by throwing an exception. This behavior prevents the rest of the tables from going into an inconsistent state. Using the [dynamic reinitialization feature]({{< ref "docs/references/dynamic-reinitialization" >}}), you can add the tables Replicant excludes from replication. 

You can also disable [`skip-tables-on-failures`]({{< ref "docs/targets/configuration-files/applier-reference#skip-tables-on-failures" >}}). In that case, Replicant throws an exception and performs real-time recovery when you resume replication with [the `--resume` option]({{< ref "docs/running-replicant#various-replication-options-explanation" >}}).
</dd>

<dt>During realtime phase with global replay consistency</dt>
<dd>

Replicant dumps the Stream entry IDs for the messages it couldn't delete programmatically in the following file: 

```
$REPLICANT_HOME/data/<replication_id>/bad_rows/replicate_io_indoubt_txn_log
````

You need to clean up those entries manually and [resume the replication run]({{< ref "/docs/running-replicant#various-replication-options-explanation" >}}). You can use the following command for cleaning up the entries:

```sh
redis-cli XDEL STREAM_NAME STREAM_ENTRY_ID_FROM_FILE [,STREAM_ENTRY_ID_FROM_FILE]
```

Replace `STREAM_NAME` and `STREAM_ENTRY_ID_FROM_FILE` with the corresponding stream names and IDs.

</dd>
</dl>

### Transactional consistency in realtime mode
Realtime mode supports the following two consistency modes.

<dl class="dl-indent">

<dt><code>GLOBAL</code></dt>
<dd>
Replicant carries out real-time replication with global transactional consistency. A single stream holds CDC logs in transaction order.
</dd>

<dt><code>EVENTUAL</code></dt>
<dd>
Replicant carries out real-time replication with eventual consistency. Replicant also carries out replay per table and a stream object exists for each table.
</dd>

</dl>

Set the realtime configuration parameter `replay-consistency` to whatever mode you want [under the `realtime` section of the Applier configuration file](#configure-realtime-mode).

## DML message structure
1. Each message contains a key and a value. The key uniquely identifies the change.
2. Each message contains a schema and a payload. The payload follows the schema definition.
3. Replicant uses primary key, unique key, or row identifier key column to form key structure. In the absence of primary key, unique key, or row identifier key column, Replicant uses the `"default"` string for the key. 
4. Whenever a column that uniquely identifies a record is updated, instead of creating an update event, Replicant generates delete and insert events. The delete event deletes existing record and insert event inserts a new record. 
5. For each delete operation, Replicant generates a tombstone event. Replicant assigns the event the same key as the previous delete operation and sets the value to `"default"`.

{{< details title="Click to see sample key and value structure" open=false >}}

### Key structure
```JSON
{
  "schema": {
    "type": "struct",
    "optional": false,
    "name": "REDIS_STREAM_Connector.tpch.region.Key",
    "fields": [
      {
        "type": "int32",
        "optional": false,
        "field": "r_regionkey"
      }
    ]
  },
  "payload": {
    "r_regionkey": 10
  }
}
```

### Value structure
```JSON
{
  "schema": {
    "type": "struct",
    "optional": false,
    "name": "REDIS_STREAM_Connector.tpch.region.Envelope",
    "fields": [
      {
        "type": "struct",
        "optional": true,
        "field": "before",
        "name": "REDIS_STREAM_Connector.tpch.region.Value",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "r_regionkey"
          },
          {
            "type": "string",
            "optional": false,
            "field": "r_name"
          },
          {
            "type": "string",
            "optional": true,
            "field": "r_comment"
          }
        ]
      },
      {
        "type": "struct",
        "optional": true,
        "field": "after",
        "name": "REDIS_STREAM_Connector.tpch.region.Value",
        "fields": [
          {
            "type": "int32",
            "optional": false,
            "field": "r_regionkey"
          },
          {
            "type": "string",
            "optional": false,
            "field": "r_name"
          },
          {
            "type": "string",
            "optional": true,
            "field": "r_comment"
          }
        ]
      },
      {
        "type": "struct",
        "optional": false,
        "field": "source",
        "name": "REDIS_STREAM_Connector",
        "fields": [
          {
            "type": "string",
            "optional": false,
            "field": "version"
          },
          {
            "type": "string",
            "optional": false,
            "field": "connector"
          },
          {
            "type": "string",
            "optional": false,
            "field": "name"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "ts_ms"
          },
          {
            "type": "string",
            "optional": true,
            "field": "db"
          },
          {
            "type": "string",
            "optional": true,
            "field": "schema"
          },
          {
            "type": "string",
            "optional": false,
            "field": "table"
          },
          {
            "type": "string",
            "optional": true,
            "field": "query"
          },
          {
            "type": "string",
            "optional": true,
            "field": "snapshot"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "server_id"
          },
          {
            "type": "string",
            "optional": true,
            "field": "gtid"
          },
          {
            "type": "string",
            "optional": true,
            "field": "file"
          },
          {
            "type": "int64",
            "optional": true,
            "field": "pos"
          },
          {
            "type": "int32",
            "optional": true,
            "field": "row"
          }
        ]
      },
      {
        "type": "string",
        "optional": false,
        "field": "op"
      },
      {
        "type": "int64",
        "optional": true,
        "field": "ts_ms"
      }
    ]
  },
  "payload": {
    "before": {
      "r_regionkey": 10,
      "r_name": "Test_nation",
      "r_comment": "ReplicationWorks"
    },
    "after": {
      "r_regionkey": 10,
      "r_name": "Test_nation",
      "r_comment": "TestReplication"
    },
    "source": {
      "version": "5.7.41",
      "connector": "MYSQL",
      "name": "REDIS_STREAM_Connector",
      "ts_ms": 1681129889000,
      "db": "tpch",
      "schema": null,
      "table": "region",
      "snapshot": "false",
      "server_id": "1",
      "gtid": null,
      "file": "mysql-log.000019",
      "pos": 4436,
      "row": 5,
      "thread": 69,
      "query": "UPDATE tpch.region SET r_regionkey=10 AND r_name=Test_nation AND r_comment=TestReplication WHERE r_regionkey=10 AND r_name=Test_nation AND r_comment=ReplicationWorks"
    },
    "op": "u",
    "ts_ms": 1681110090233
  }
}
```
{{< /details >}}