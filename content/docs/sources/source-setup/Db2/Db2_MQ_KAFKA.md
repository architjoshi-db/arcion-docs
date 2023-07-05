---
pageTitle: Documentation for Db2 Source with Kafka and MQ
title: Kafka and MQ
description: "Db2 connector by Arcion integrates natively with Kafka and IBM MQ, making it easier to manage CDC logs. Learn everything about it right here."
url: docs/source-setup/db2/db2_mq_kafka
bookHidden: false
---

# Source IBM Db2 with Kafka/MQ
This page describes how to set up Source Db2 with Kafka and MQ.

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## I. Check permissions
You need to verify that the user possesses necessary permissions on source Db2 in order to perform replication. To know about the permissions, see [IBM Db2 permissions]({{< ref "docs/sources/source-prerequisites/db2#permissions" >}}).

## II. Enable CDC replication for Db2 MQ
To enable CDC-based replication from the Source Db2 MQ server, follow the instructions in [Enabling CDC replication for Db2 MQ]({{< ref "docs/sources/source-prerequisites/db2#enabling-cdc-replication" >}}).

## III. Create the heartbeat table
For CDC replication, you must create the heartbeat table on the source database:

```SQL
CREATE TABLE "tpch"."replicate_io_cdc_heartbeat"("timestamp" BIGINT NOT NULL, 
CONSTRAINT "cdc_heartbeat_id_default_default" PRIMARY KEY("timestamp"))
```

## IV. Set up connection configuration
Specify our connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `db2_src.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

### Configure Db2 server connection
To connect to Db2 with basic username and password authentication, you have these two options: 
{{< tabs "username-pwd-connection-method" >}}
{{< tab "Specify credentials in plain text" >}}
You can specify your credentials in plain form in the connection configuration file like the folowing sample:
```YAML
type: DB2

database: tpch #Name of the catalog from which the tables are to be replicated
host: localhost
port: 50002

username: replicant
password: "Replicant#123"

max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000

proxy-source: false
```

If you set `proxy-source` to `true`, Replicant doesn't attempt to connect to the source database. You can enable it for real-time mode if the log exists in a separate storage space than the source database.
{{< /tab >}}

{{< tab "Fetch credentials from AWS Secrets Manager" >}}
If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}).
{{< /tab >}}
{{< /tabs>}}

### Configure CDC logs and monitoring
For CDC-based replication from source Db2 server, you can choose between IBM MQ and Kafka as the storage for Db2 logs. To specify the storage type, use the `cdc-log-storage` parameter. All CDC log and monitoring configurations start with the parent field `cdc-log-config`.

{{< tabs "db2-logs-mq-kafka" >}}
{{< tab "IBM MQ as CDC log storage" >}}

For IBM MQ as `cdc-log-storage`, you can configure the following parameters:

#### `mqueue-connections`
If you enable real-time replication and use IBM MQ for CDC logs, then you need to specify MQ connection information in this field. To connect to MQ, you can either specify credentials in plain text form, or use SSL.
<dl class="dl-indent">
<dt>
Specify MQ connection credentials in plain text 
</dt>
<dd>
<dl class="dl-indent">
<dt>

`host`
</dt>
<dd>The host running MQ queue manager.</dd>
<dt>

`port`
</dt> 
<dd>The port number on the MQ queue manager host.</dd>

<dt>

`username`
</dt>
<dd>The username to connect to the MQ queue manager.</dd>
<dt>

`password`
</dt>
<dd>

The associated password with `username`.</dd>
</dl>

<dt>Use SSL to connect to MQ</dt>
<dd>

To use SSL connection, specify the SSL details under the `ssl` field. The following details are required
</dd>
<dl class="dl-indent">
<dt>

`trust-store`
</dt>
<dd>

Details about the TrustStore. The following details are required:
- **`path`**. Path to TrustStore.
- **`password`**. Password for the TrustStore.
</dd>
<dt>

`key-store`
</dt>
<dd>

Details about the KeyStore. The following details are required:
- **`path`**. Path to KeyStore.
- **`password`**. Password for the KeyStore.

You must specify this parameter if you have two-way authentication enabled on MQ.
</dd>
<dt>

`ssl-cipher-suite`
</dt>
<dd>

Provide the encryption algorithm based on what the configuration on MQ Manager—for example, `TLS_RSA_WITH_AES_128_CBC_SHA256`.</dd>
</dl>

<dt>

`queue-manager`
</dt>
<dd>Name of the queue manager to connect to.</dd>
<dt>

`queue-channel`
</dt>
<dd>The name of the channel to connect to on the queue manager.</dd>
<dt>

`queues`
</dt>
<dd>

List of IBM MQ queues to connect to.
<dl class="dl-indent">
<dt>

`name`
</dt>
<dd>

Name of IBM MQ queue.
</dd>
<dt>

`message-format`
</dt>
<dd>

The format of message from IBM MQ:
- `XML`
- `DELIMITED`
</dd>
<dt>

`message-type` _[v21.02.01.8]_
</dt>
<dd>

Specifies the type of message from IBM MQ:

- `ROW`
- `TRANSACTION`

Message type depends on the value of the `MESSAGE CONTENT TYPE` that you set [using `PubQMap`](https://www.ibm.com/docs/en/idr/11.4.0?topic=publishing-create-pubqmap-command). For `R` as `MESSAGE CONTENT TYPE`, you can set `message-type` to `ROW`. For `T` as `MESSAGE CONTENT TYPE`, you can set `message-type` to `TRANSACTION`.
</dd>

<dt>

`lob-send-option`
</dt>
<dd>

Specifies whether LOB columns are inlined or received in separate MQ messages:

- `INLINE`
- `SEPARATE`
</dd>
</dl>
</dd>
<dt>

`backup-mqueue-connection` _[v[20.04.06.1]_
</dt>
<dd>
Connection details for the backup MQ manager. 

Specifying this configuration allows Replicant to seamlessly fall back to the backup MQ manager when primary MQ Manager goes down. You can configure all parameters for backup MQ in a similar fashion to the primary MQ manager.
<dl class="dl-indent">
<dt>
Specify MQ connection credentials in plain text 
</dt>
<dd>
<dl class="dl-indent">
<dt>

`host`
</dt>
<dd>The host running MQ queue manager.</dd>
<dt>

`port`
</dt> 
<dd>The port number on the MQ queue manager host.</dd>

<dt>

`username`
</dt>
<dd>The username to connect to the MQ queue manager.</dd>
<dt>

`password`
</dt>
<dd>

The associated password with `username`.</dd>
</dl>

<dt>Use SSL to connect to MQ</dt>
<dd>

To use SSL connection, specify the SSL details under the `ssl` field. The following details are required
</dd>
<dl class="dl-indent">
<dt>

`trust-store`
</dt>
<dd>

Details about the TrustStore. The following details are required:
- **`path`**. Path to TrustStore.
- **`password`**. Password for the TrustStore.
</dd>
<dt>

`key-store`
</dt>
<dd>

Details about the KeyStore. The following details are required:
- **`path`**. Path to KeyStore.
- **`password`**. Password for the KeyStore.

You must specify this parameter if you have two-way authentication enabled on MQ.
</dd>
<dt>

`ssl-cipher-suite`
</dt>
<dd>

Provide the encryption algorithm based on what the configuration on MQ Manager—for example, `TLS_RSA_WITH_AES_128_CBC_SHA256`.</dd>
</dl>

<dt>

`queue-manager`
</dt>
<dd>Name of the queue manager to connect to.</dd>
<dt>

`queue-channel`
</dt>
<dd>The name of the channel to connect to on the queue manager.</dd>
<dt>

`queues`
</dt>
<dd>

List of IBM MQ queues to connect to.
<dl class="dl-indent">
<dt>

`name`
</dt>
<dd>

Name of IBM MQ queue.
</dd>
<dt>

`message-format`
</dt>
<dd>

The format of message from IBM MQ:
- `XML`
- `DELIMITED`
</dd>
<dt>

`message-type` _[v21.02.01.8]_
</dt>
<dd>

Specifies the type of message from IBM MQ:

- `ROW`
- `TRANSACTION`
</dd>

<dt>

`lob-send-option`
</dt>
<dd>

Specifies whether LOB columns are inlined or received in separate MQ messages:

- `INLINE`
- `SEPARATE`
</dd>
</dl>
</dd>
</dd>
</dl>
</dl>

The following shows a sample CDC log configuration using MQ as `cdc-log-storage`:

```YAML
cdc-log-config:
  cdc-log-storage: MQ
  mqueue-connections:
    queue-conn1:
      host: localhost
      port: 1450
      queue-manager: CDC_QM
      queue-channel: CDC_Q_CHANNEL
      username: queue_manager
      password: queue_manager
      queues:
      - name: CDC_LOG_Q
      message-format: XML
      message-type: ROW
      lob-send-option: INLINE
        backup-mqueue-connection:
          host: localhost
          port: 1460
          queue-manager: CDC_QM_BACKUP
          queue-channel: CDC_Q_BACKUP_CHANNEL
          username: backup_queue_manager
          password: backup_queue_manager
          queues:
          - name: CDC_LOG_BACKUP_Q
```
{{< /tab >}}
{{< tab "Kafka as CDC log storage" >}}
If you choose Kafka for CDC logs, set `cdc-log-storage` to one of the following types:

- `KAFKA_TRANSACTIONAL`
- `KAFKA_EVENTUAL`

The connection details for Kafka start with the parent `kafka-connection` field. It contains the following parameters:

<dl class="dl-indent">
<dt>

`cdc-log-topic`
</dt>
<dd>

The Kafka topic containing Db2 CDC log. Applicable when using `KAFKA_TRANSACTIONAL` as `cdc-log-storage`.

The following parameters are required:
<dl class="dl-indent">
<dt>

`cdc-log-topic-prefix` _[v20.12.04.7]_
</dt>
<dd>

The common prefix for all Kafka topics undergoing replication. Applicable when you set `cdc-log-config` to either `KAFKA_EVENTUAL` or `KAFKA_AVRO`.
</dd>
<dt>

`cdc-log-topic-prefix-list` _[v21.02.01.19]_
</dt>
<dd>

List of mappings from common prefixes to source tables:
- **`cdc-log-topic-prefix`**. The common prefix for all Kafka IIDR topics.
- **`tables`**. An array of table names.
</dd>
<dt>

`message-format`
</dt>
<dd>

Format of message received from Kafka:

- `XML`
- `DELIMITED`
- `KCOP_MULTIROW_AUDIT`
</dd>
<dt>

`message-type`
</dt>
<dd>

Specifies the message type:

- `ROW`
- `TRANSACTION`

This parameter applies only when you set `message-format` to `XML`.
</dd>
<dt>

`lob-send-option`
</dt>
<dd>

Specifies whether LOB columns are inlined or received in separate MQ messages:

- `INLINE`
- `SEPARATE`.
</dd>
<dt>

`connection`
</dt>
<dd>

Connection configuration to connect to Kafka. For more information, see the sample configurations in the next sections.
</dd>
</dl>
</dd>
</dl>
  
When using Kafka as CDC log storage, keep the following in mind:

- For `KAFKA_TRANSACTIONAL` as `cdc-log-storage`, based on the value of `message-format`, the following assumptions takes place:
   - If you set `message-format` to `XML` or `DELIMITED`, then the key of record is the MQ `MessageId` and value is the `MQMessage` in `XML` or `DELIMITED` format.
   - If you set `message-format` to `KCOP_MULTIROW_AUDIT`, then `cdc-log-topic` corresponds to the topic name of the `COMMIT-STREAM` topic associated with the subscription. Replicant replicates the topic in a transactionally consistent manner.

- For `KAFKA_EVENTUAL` as `cdc-log-storage`, the topic name follows the format `cdc-log-topic-prefix.<table_name>`. This format follows the IBM IIDR naming scheme for Kafka topics. See the sample configurations in the next sections for better understanding. 

By default, IIDR creates a Kafka topic using the following naming convention:

```
<datastore_name>.<subscription_name>.<database>.<schema>.<table>
```
In this case, set `cdc-log-topic-prefix` to the following:

```
<datastore_name>.<subscription_name>.<database>.<schema>
```

#### Sample configuration for `KAFKA_TRANSACTIONAL`

```YAML
cdc-log-config:
  cdc-log-storage: KAFKA_TRANSACTIONAL
  kafka-connection:
    cdc-log-topic: cdc_log_topic
    message-format: XML
    message-type: ROW
    lob-send-option: INLINE
    connection:
      brokers:
        broker1:
          host: localhost
          port: 19092
```

#### Sample configuration for `KAFKA_EVENTUAL`

```YAML
cdc-log-config:
  cdc-log-storage: KAFKA_EVENTUAL
    kafka-connection:
      cdc-log-topic-prefix: ""
      cdc-log-topic-prefix-list: 
      - cdc-log-topic-prefix: "" .
        tables: [table1, table2]
      - cdc-log-topic-prefix: ""
        tables: [table3, table4]

      message-format: KCOP_MULTIROW_AUDIT
      connection:
        brokers:
          broker1:
            host: localhost
            port: 19092
        schema-registry-url: "http://localhost:8081"
        consumer-group-id: blitzz
```

{{< /tab >}}
{{< /tabs >}}

## V. Set up Extractor configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `db2.yaml` in the `$REPLICANT_HOME/conf/src` directory. For example:

### Configure `snapshot` mode
For `snapshot` mode, you can make use of the following sample:

```YAML
snapshot:
  threads: 16
  fetch-size-rows: 5_000

  _traceDBTasks: true
  fetch-schemas-from-system-tables: true

  per-table-config:
  - catalog: tpch
    schema: db2user
    tables:
      lineitem:
        row-identifier-key: [l_orderkey, l_linenumber]
```

For more information about the Extractor parameters for `snapshot` mode, see [Snapshot mode]({{< relref "../../configuration-files/extractor-reference#snapshot-mode" >}}).

### Configure `delta-snapshot` mode
For `delta-snapshot` mode, you can make use of the following sample:

```YAML
delta-snapshot:
  #threads: 32
  #fetch-size-rows: 10_000

  #min-job-size-rows: 1_000_000
  max-jobs-per-chunk: 32
  _max-delete-jobs-per-chunk: 32

  delta-snapshot-key: last_update_time
  delta-snapshot-interval: 10
  delta-snapshot-delete-interval: 10
  _traceDBTasks: true
  replicate-deletes: false

  per-table-config:
    - catalog: tpch
      schema: db2user
      tables:
        #      testTable
        #        split-key: split-key-column
        #        split-hints:
        #          row-count-estimate: 100000 
        #          split-key-min-value: 1 
        #          split-key-max-value: 60_000
        #        delta-snapshot-key: delta-snapshot-key-column
        #        row-identifier-key: [col1, col2]
        #        update-key: [col1, col2]
        partsupp:
          split-key: partkey
```

For more information about the Extractor parameters for `delta-snapshot` mode, see [Delta-snapshot mode]({{< relref "../../configuration-files/extractor-reference#delta-snapshot-mode" >}}).

### Configure `realtime` mode
For real-time replication, the `start-position` parameter specifying the starting log position follows a different structure for Db2 MQ and Db2 Kafka. For more information, see the following two samples:

#### Sample Extractor configurations for `realtime` mode
{{< tabs "extractor-config-db2-mq-kafka" >}}
{{< tab "Db2 MQ" >}}

```YAML
realtime:
  #threads: 1
  #fetch-size-rows: 10000
  _traceDBTasks: true
  #fetch-interval-s: 0
  replicate-empty-string-as-null: true

#  start-position:
#    commit-time: '2020-08-24 08:16:38.019002'
# idempotent-replay: false

  heartbeat:
    enable: true
    catalog: tpch
    schema: db2user
    #table-name: replicate_io_cdc_heartbeat
    #column-name: timestamp
    interval-ms: 10000
```

In preceding sample, notice the following details:

- The `start-position` parameter specifies the starting log position for real-time replication. For more information, see [Db2 with MQ in Extractor Reference]({{< ref "../../configuration-files/extractor-reference#db2-with-mq" >}}).
- If you set `message-format` to `DELIMITED`, set `replicate-empty-string-as-null` to `true`.
  {{< /tab >}}
  {{< tab "Db2 Kafka" >}}

```YAML
realtime:
  #threads: 1
  #fetch-size-rows: 10000
  _traceDBTasks: true
  #fetch-interval-s: 0
  replicate-empty-string-as-null: true

#  start-position:
#    start-offset: LATEST
# idempotent-replay: false

  heartbeat:
    enable: true
    catalog: tpch
    schema: db2user
    #table-name: replicate_io_cdc_heartbeat
    #column-name: timestamp
    interval-ms: 10000
```

In the sample above, notice the following details:
- The `start-position` parameter specifies the starting log position for realtime replication. For more information, see [Db2 with Kafka in Extractor Reference]({{< ref "../../configuration-files/extractor-reference#db2-with-kafka" >}}).
- If you set `message-format` to `DELIMITED`, set `replicate-empty-string-as-null` to `true`.
{{< /tab >}}
{{< /tabs >}}
For more information about the Extractor parameters for `realtime` mode, see [Realtime mode]({{< relref "../../configuration-files/extractor-reference#realtime-mode" >}}).