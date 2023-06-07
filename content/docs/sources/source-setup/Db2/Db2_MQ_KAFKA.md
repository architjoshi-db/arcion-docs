---
pageTitle: Documentation for Db2 Source with Kafka and MQ
title: Kafka and MQ
description: "Db2 connector by Arcion integrates natively with Kafka and IBM MQ, making it easier to manage CDC logs. Learn everything about it right here."
url: docs/source-setup/db2/db2_mq_kafka
bookHidden: false
---

# Source IBM Db2 with Kafka/MQ

This page describes how to set up Source Db2 with Kafka and MQ.

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Check Permissions
You need to verify that the necessary permissions are in place on source Db2 in order to perform replication. To know about the permissions, see [IBM Db2 Permissions]({{< ref "docs/sources/source-prerequisites/db2#permissions" >}}).

## II. Enable CDC Replication for Db2 MQ

For enabling CDC-based replication from the Source Db2 MQ server, please follow the instructions in [Enabling CDC Replication for Db2 MQ]({{< ref "docs/sources/source-prerequisites/db2#enabling-cdc-replication" >}}).

## III. Create the Heartbeat Table

For CDC replication, you must create the heartbeat table on the source database with the following DDL:

```SQL
CREATE TABLE "tpch"."replicate_io_cdc_heartbeat"("timestamp" BIGINT NOT NULL, 
CONSTRAINT "cdc_heartbeat_id_default_default" PRIMARY KEY("timestamp"))
```

## IV. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:

   ```BASH
   vi conf/conn/db2.yaml
   ```

2. The configuration file has two parts: 

   * Parameters related to source Db2 server connection.
   * Parameters related to CDC logs and monitoring.

### Parameters Related to Source Db2 server connection
If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}). 
    
Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

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

  #proxy-source: false
  ```
  - If you set `proxy-source` to `true`, Replicant will not attempt to connect to the source database. You can enable it for real-time mode if the log is in a separate storage space than the source database.

### Parameters Related to CDC Logs and Monitoring

For CDC-based replication from source Db2 server, you can choose between IBM MQ and Kafka as the storage of Db2 logs. All CDC log and monitoring configurations live under the field `cdc-log-config`. You specify the storage type via the `cdc-log-storage` parameter. Notice the following details about each of the storage type that you can use:

#### CDC Log Storage type
{{< tabs "db2-logs-mq-kafka" >}}
{{< tab "IBM MQ" >}}

For IBM MQ as `cdc-log-storage`, the following parameters are available for you to configure:

i. `mqueue-connections`: If you enable realtime replication and use IBM MQ for CDC logs, then you need to specify MQ connection information in this field. Each connection can have the following parameters:
   - `host`: The host on which MQ queue manager is running.
   - `port`: The port number to connect to MQ queue manager.
   - `queue-manager`: Name of queue manager to connect to.
   - `queue-channel`: The name of the channel to connect to on the queue manager.
   - `username`: The username to connect to the MQ queue manager.
   - `password`: The associated password.
   - `queues`: List of IBM MQ queues to connect to.
     - `name` : Name of IBM MQ queue.
     - `message-format`: Format of message that will be received from IBM MQ. Allowed values are `XML` and `DELIMITED`.
     - `message-type`[21.02.01.8]: Type of message that will be received from IBM MQ. Allowed values are `ROW` and `TRANSACTION`.
     - `lob-send-option`: If LOB columns are inlined or will be received in separate MQ messages. Allowed values are `INLINE` and `SEPARATE`.
   - `ssl`:
     - `trust-store`:
       - `path`: Path to truststore.
       - `password`: Password for the truststore.
     - `key-store`: You'll need this if you have 2-way authentication enabled on MQ.
       - `path`: Path to truststore.
       - `password`: Password for the truststore.
     - `ssl-cipher-suite`: Provide your encryption algorithm based what is configured on MQ Manager.
   - `backup-mqueue-connection`[20.04.06.1]: Connection details for the backup MQ manager. Providing this configuration allows Replicant to seamlessly failover to the backup MQ Manager when primary MQ Manager is down. You can configure all configuration parameters for backup MQ in a similar fashion to the primary MQ Manager.
     - `host`: The host on which MQ queue manager is running.
     - `port`: The port number to connect to MQ queue manager.
     - `queue-manager`: Name of queue manager to connect to.
     - `queue-channel`: The name of the channel to connect to on
     the queue manager
     - `username`: The username to connect to the MQ queue manager.
     - `password`: The associated password.
     - `queues`: List of IBM MQ queues to connect to.
       - `name`: Name of IBM MQ queue.
       - `message-format`: Format of message that will be received from IBM MQ. Allowed values are `XML` and `DELIMITED`.
       - `message-type`[21.02.01.8]: Type of message that will be received from IBM MQ. Allowed values are `ROW` and `TRANSACTION`.
       - `lob-send-option`: If LOB columns are inlined or will be received in separate MQ messages. Allowed values are `INLINE`, `SEPARATE`.
     - `ssl`:
       - `trust-store`:
         - `path`: Path to truststore.
         - `password`: Password for the truststore.
       - `key-store`: You'll need this if you have 2-way authentication enabled on MQ (for example client authentication).
         - `path`: Path to truststore.
         - `password`: Password for the truststore.
       - `ssl-cipher-suite`: The encryption algorithm configured on MQ.

{{< hint "info" >}}
**Note:** You can configure the `message-type` of queues to `ROW` or `TRANSACTION` depending on the value of the `MESSAGE CONTENT TYPE` that you set using `PubQMap`. If it's set to `R`, then `message-type` can be `ROW`. If it's set to `T`, then `message-type` can be `TRANSACTION`.
{{< /hint >}}
Below is a sample CDC Log configuration using MQ as `cdc-log-storage`:

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
          #message-format: XML
          #message-type: ROW
          #lob-send-option: INLINE
          #  backup-mqueue-connection:
          #    host: localhost
          #    port: 1460
          #    queue-manager: CDC_QM_BACKUP
          #    queue-channel: CDC_Q_BACKUP_CHANNEL
          #    username: backup_queue_manager
          #    password: backup_queue_manager
          #    queues:
          #    - name: CDC_LOG_BACKUP_Q
          #    ssl:
          #      trust-store:
          #        path: "/path/to/trust/store"
          #        password: 'changeit'
          #      key-store:
          #        path: "/path/to/key/store"
          #        password: 'changeit'
          #      ssl-cipher-suite: 'TLS_RSA_WITH_AES_128_CBC_SHA256'

          #
          #- name: CDC_LOG_Q_DELIMITED
          #  message-format: DELIMITED
          #ssl:
          #  trust-store:
          #    path: "/path/to/trust/store"
          #    password: 'changeit'
          #  key-store:
          #    path: "/path/to/key/store"
          #    password: 'changeit'
          #  ssl-cipher-suite: 'TLS_RSA_WITH_AES_128_CBC_SHA256'
  ```
{{< /tab >}}
{{< tab "Kafka" >}}
If you choose Kafka for CDC logs, set `cdc-log-storage` to one of the following types:

- `KAFKA_TRANSACTIONAL`
- `KAFKA_EVENTUAL`

The connection details for Kafka live under the `kafka-connection` field. It contains the following parameters:

- `cdc-log-topic`: The Kafka topic that contains Db2 CDC log. To be used when cdc-log-config is `KAFKA_TRANSACTIONAL`.
  - `cdc-log-topic-prefix`[20.12.04.7]: The common prefix for all Kafka topics that will be replicated. To be used when `cdc-log-config` is `KAFKA_EVENTUAL` or `KAFKA_AVRO`.
  - `cdc-log-topic-prefix-list`[21.02.01.19]: List of mapping from common prefixes to source tables.
    - `cdc-log-topic-prefix`: The common prefix for all Kafka IIDR topics.
    - `tables`: An array of table names.
  - `message-format`: Format of message that will be received from Kafka. Allowed values are `XML`, `DELIMITED`, and `KCOP_MULTIROW_AUDIT`.
  - `message-type`: Message type. Allowed values are `ROW` and `TRANSACTION`. This parameter is valid only when `message-format` is set to `XML`.
  - `lob-send-option`: If LOB columns are inlined or will be received in separate messages from Kafka. Allowed values are `INLINE` and `SEPARATE`.
  - `connection`: Connection config for connecting to Kafka. For more information, see the sample configurations below.

{{< hint "info" >}}
**Note**:
1. For `KAFKA_TRANSACTIONAL` as `cdc-log-storage`, based on the value of `message-format`, the following assumptions will take place:
   - If the `message-format` is `XML`/`DELIMITED`, then the assumption is that the key of record is the MQ `MessageId` and value is the `MQMessage` in `XML`/`DELIMITED` format.
   - If the `message-format` is `KCOP_MULTIROW_AUDIT`, then the assumption is that the `cdc-log-topic` is the topic name of the `COMMIT-STREAM` topic associated with the subscription that will be replicated in a transactionally consistent manner.

2. For `KAFKA_EVENTUAL` as `cdc-log-storage`, the assumption is that the topic name is in format `cdc-log-topic-prefix.<table_name>`. Assumption is based on the naming scheme IBM IIDR follows for Kafka topics. See the sample configuration below for better understanding. 

By default, IIDR creates a Kafka topic using the following naming convention:

```
<datastore_name>.<subscription_name>.<database>.<schema>.<table>
```
In this case, you should set `cdc-log-topic-prefix` to the following:
```
<datastore_name>.<subscription_name>.<database>.<schema>
```
{{< /hint >}}

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

{{< /tab >}}
{{< /tabs >}}

## V. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the Extractor configuration file:
   ```BASH
   vi conf/src/db2.yaml
   ```

2. The Extractor configuration file has three parts:

    - Parameters related to snapshot mode.
    - Parameters related to delta snapshot mode.
    - Parameters related to realtime mode.

    ### Parameters related to snapshot mode
    For snapshot mode, you can make use of the following sample:

    ```YAML
    snapshot:
      threads: 16
      fetch-size-rows: 5_000

      _traceDBTasks: true
      #fetch-schemas-from-system-tables: true

      per-table-config:
      - catalog: tpch
        schema: db2user
        tables:
          lineitem:
            row-identifier-key: [l_orderkey, l_linenumber]
    ```

    ### Parameters related to delta snapshot mode
    For delta delta snapshot mode, you can make use of the following sample:

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

    ### Parameters related to realtime mode
    For realtime mode, the `start-position` parameter specifying the starting log position for realtime replication is differently structured for Db2 MQ and Db2 Kafka. For more information, see the following two samples:

    #### Sample Extractor realtime configurations
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
  
  - The `start-position` parameter specifies the starting log position for realtime replication. For more information, see [Db2 with MQ in Extractor Reference]({{< ref "../../configuration-files/extractor-reference#db2-with-mq" >}}).
  - If you've set `message-format` to `DELIMITED`, set `replicate-empty-string-as-null` to `true`.
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
  - If you've set `message-format` to `DELIMITED`, set `replicate-empty-string-as-null` to `true`.
  {{< /tab >}}
  {{< /tabs >}}

For a detailed explanation of configuration parameters in the Extractor file, read [Extractor Reference]({{< ref "../../configuration-files/extractor-reference" >}} "Extractor Reference").