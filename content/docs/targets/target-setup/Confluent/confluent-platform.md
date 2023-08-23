---
pageTitle: Documentation for Confluent Platform as target
title: Confluent Platform
description: "Seamlessly ingest data into Confluent Platform for real-time data flow and processing using Arcion."
weight: 2
bookHidden: false
url: docs/target-setup/confluent/confluent-platform
---

# Destination Confluent Platform

In the following steps, we refer [the extracted `replicant-cli`]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

{{< hint "info" >}}
Don't have a Confluent Platform account? Get one [here](https://www.confluent.io/confluent-cloud/?utm_campaign=tm.fm-ams_cd.cwc-arcion-newuser&utm_medium=partnerref).
{{< /hint >}}

## I. Set up connection configuration
{{< tabs "confluent-cloud-connection-config-in-cli-cloud" >}}
{{< tab "Arcion self-hosted CLI" >}}
Specify your Confluent Platform connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `confluent.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

Specify your connection in the following manner:

```YAML
type: KAFKA

username: 'CLUSTER_API_KEY'
password: 'CLUSTER_API_SECRET'

auth-type: SASL 
brokers:
  broker1:
    host: 'BOOTSTRAP_SERVER_NAME'
    port: 'BOOTSTRAP_SERVER_PORT'

is-cloud-instance: true
max-connections: 30
```

Replace the following:
- *`CLUSTER_API_KEY`*: the [resource-specific API key](https://docs.confluent.io/cloud/current/access-management/authenticate/api-keys/api-keys.html#resource-specific-api-keys) to access your Kafka cluster.
- *`CLUSTER_API_SECRET`*: the secret associated with your *`CLUSTER_API_KEY`*.
- *`BOOTSTRAP_SERVER_NAME`*: [the bootstrap server name for your cluster](https://docs.confluent.io/cloud/current/clusters/broker-config.html#access-cluster-settings-in-the-ccloud-console).
- *`PORT_NUMBER`*: [the bootstrap server port for your cluster](https://docs.confluent.io/cloud/current/clusters/broker-config.html#access-cluster-settings-in-the-ccloud-console).

In the preceding configuration, `max-connections` specifies the maximum number of connections Replicant can open in Confluent Platform. Feel free to change its value as you need.
{{< /tab >}}

{{< tab "Arcion Cloud and Arcion on-premises UI" >}}
In Arcion Cloud, fill up the connection details in the **Connection form** tab. The **Connection form** requires the same set of connection details as Arcion self-hosted CLI:

- Enter a name for your connection in the **Connection name** field.
- Enter the [bootstrap hostname and port number](https://docs.confluent.io/platform/current/installation/configuration/producer-configs.html#bootstrap-servers) in the **Bootstrap Host** and **Port** fields respectively.
- Enter the [resource-specific API key](https://docs.confluent.io/cloud/current/access-management/authenticate/api-keys/api-keys.html#resource-specific-api-keys) to access your Kafka cluster in the **Key** field.
- Enter the secret associated with your **Key** in the **Secret** field.
- Specify the maximum number of connections Replicant can open in Confluent Platform in the **Max connections** field. Defaults to `30`. 
- Specify the duration in milliseconds Replicant waits before retrying a failed operation in the **Retry wait durations in ms** field. Defaults to `1000`.
- Specify the number of times Replicant retries a failed operation in the **Max retries** field. Defaults to `30`.
{{< /tab >}}
{{< /tabs >}}

## II. Configure mapper file (optional)
If you want to define data mapping from your source to Confluent Platform, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}).

When mapping source object names to Kafka topics, you can choose between two delimiters for topic names. For more information, see [Delimiter in Kafka topic and Redis stream names]({{< ref "docs/targets/configuration-files/mapper-reference#delimiter-in-kafka-topic-and-redis-stream-names" >}}).

## III. Set up Applier configuration    

1. From `$REPLICANT_HOME`, naviagte to the sample Confluent Platform Applier configuration file:
   ```BASH
   vi conf/dst/confluent.yaml
   ```
2. The configuration file contains global Applier parameters, with snapshot and realtime parameters following the global parameters:

    - [Global configuration parameters](#global-configuration-parameters)
    - [Parameters related to snapshot mode](#parameters-related-to-snapshot-mode)
    - [Parameters related to realtime mode](#parameters-related-to-realtime-mode)

    ### Global configuration parameters
    Global configuration parameters live at the topmost level of the Applier configuration file. So you _must_ specify them at the topmost place of the Applier configuration file. The global configuration parameters affect both snapshot and real-time replication.
    
    The following global Applier configuration parameters are available.

    #### `replication-format`
    The structure of the published events.

    The following values are allowed:

    - [`NATIVE`]({{< ref "docs/references/cdc-format/native-format" >}})
    - [`JSON`]({{< ref "docs/references/cdc-format/json-cdc-format" >}})

    ### Parameters related to snapshot mode
    For snapshot mode, the following Confluent Platform-specific parameters are available:

    #### `replication-factor` *[v21.12.02.6]*
    Replication factor for data topics. For Kafka cluster setup this defines the factor in which Kafka topic partitions are replicated on different brokers. We pass this config value to Kafka and Kafka drives the partition level replication.

    #### `num-shards` *[v21.12.02.6]*
    Number of partitions per data topic. By default this is set to a number of applier threads for getting the best possible scaling by allowing each individual applier thread to write to an independent partition of a Kafka topic.

    #### `shard-key` *[v21.12.02.6]*
    Shard key to be used for partitioning data topics.

    #### `shard-function` *[v21.12.02.6]*
    Sharding function to be used to deduce the partition allotment based on `shard-key` for all data topics. Values allowed are `MOD` and `NONE`.

      *Default: By default, this parameter is set to `NONE`, meaning Kafka will use it’s partitioning algorithm.*

    #### `kafka-compression-type` *[v20.05.12.3]*
    Compression type. Allowed values are `lz4`, `snappy`, `gzip`, and `none`.

      *Default: By default, this parameter is set to `lz4`.*

    #### `kafka-batch-size-in-bytes` *[v20.05.12.3]*
    Batch size for Kafka producer.
    
      *Default: By default, this parameter is set to `100000`.*

    #### `kafka-buffer-memory-size-in-bytes*` *[v20.05.12.3]*
    Memory allocated to Kafka client to store unsent messages. (Default set to 67108864)

      *Default: By default, this parameter is set to `67108864`.*

    #### `kafka-linger-ms` *[v20.05.12.3]*
    Config used to give more time for Kafka batches to fill (in milliseconds).

      *Default: By default, this parameter is set to `10`.*

    #### `kafka-interceptor-classes` *[v21.09.17.2]*
    Config used to specify list of interceptor classes. It corresponds to Kafka’s `ProducerConfig.INTERCEPTOR_CLASSES_CONFIG.`
    #### `producer-max-block-ms` *[v22.07.19.7]*
    Corresponds to the [`max.block.ms` parameter of Kafka Producer](https://docs.confluent.io/platform/current/installation/configuration/producer-configs.html#max-block-ms).

      *Default: Default value is `60_000`.*

    #### `create-topic-timeout-ms` *[v22.07.19.7]*
    Specifies the timeout for topic creation.

      *Default: Default value is `60_000`.*

    #### `per-table-config` *[v20.12.04.6]*
    This configuration allows you to specify various properties for target tables on a per table basis like the following:
      <dl class="dl-indent">
       <dt><code>replication-factor</code> <i>[v21.12.02.6]</i></dt>
       <dd>Replication factor for data topics. For Kafka cluster setup, this defines the factor in which Kafka topic partitions are replicated on different brokers. We pass this config value to Kafka and Kafka drives the partition level replication.</dd>

      <dt><code>num-shards</code> <i>[v21.12.02.6]</i></dt>
       <dd>Number of partitions per data topic. By default this is set to a number of applier threads for getting the best possible scaling by allowing each individual applier thread to write to an independent partition of a Kafka topic.</dd>

      <dt><code>shard-key</code> <i>[v21.12.02.6]</i></dt>
       <dd>Shard key to be used for partitioning data topic.</dd>

      <dt><code>shard-function</code> <i>[v21.12.02.6]</i></dt>
       <dd>Sharding function to be used to deduce the partition allotment based on `shard-key` for all data topics. Values allowed are <code>MOD</code> and <code>NONE</code>. 
       
      <i>Default: By default, this parameter is set to `NONE`, meaning Kafka will use it’s partitioning algorithm.</i></dd>
      </dl>

    Below is a sample config for `snapshot` mode:

    ```YAML
    snapshot:
      threads: 16
      txn-size-rows: 10000
      replication-factor: 1
      schema-dictionary: SCHEMA_DUMP  # Allowed values: POJO | SCHEMA_DUMP| NONE
      kafka-compression-type: lz4
      kafka-batch-size-in-bytes: 100000
      kafka-buffer-memory-size-in-bytes: 67108864
      kafka-linger-ms: 10
      skip-tables-on-failures : false
      kafka-interceptor-classes: ["KafkaInterceptors.SampleInterceptor"]
      producer-max-block-ms: 60_000
      create-topic-timeout-ms: 100_000
    ```
    ### Parameters related to realtime mode
    If you want to operate in realtime mode, you can use a `realtime` section to specify your configuration. The following Kafka-specific parameters are available:

    #### `split-topic`
    `true` or `false`.

    Creates a separate topic for snapshot and CDC data if `true`. If `false`, a single topic contains the data for snapshot and CDC. `split-topic` is a global parameter for `realtime` mode. So you can't change it on a per-table basis.

    _Default: `true`._
    {{< hint "info" >}} `split-topic` is applicable _only_ when [`replication-format`](#replication-format) is set to `JSON`.
    {{< /hint >}}

    #### `replication-factor` *[v21.12.02.6]*
    Replication factor for CDC topics. For Kafka cluster setup this defines the factor in which Kafka topic partitions are replicated on different brokers. We pass this config value to Kafka and Kafka drives the partition level replication.

    #### `num-shards`*[v21.12.02.6]* 
    Number of partitions to be created for all CDC log topics.
    
    #### `shard-key` *[v21.12.02.6]*
    Shard key to be used for partitioning CDC logs in all target topics.
    
    #### `shard-function` *[v21.12.02.6]*
    Sharding function to be used to deduce the partition allotment based on `shard-key` for all CDC log topics. Values allowed are `MOD` and `NONE`.

      *Default: By default, this parameter is set to `NONE`, meaning Kafka will use it’s partitioning algorithm.*

    #### `kafka-compression-type` *[v20.05.12.3]*
    Compression type. Allowed values are `lz4`, `snappy`, `gzip`, and `none`.

      *Default: By default, this parameter is set to `lz4`.*

    #### `kafka-batch-size-in-bytes` *[v20.05.12.3]*
    Batch size for Kafka producer.
    
      *Default: By default, this parameter is set to `100000`.*

    #### `kafka-buffer-memory-size-in-bytes*` *[v20.05.12.3]*
    Memory allocated to Kafka client to store unsent messages. (Default set to 67108864)

      *Default: By default, this parameter is set to `67108864`.*

    #### `kafka-linger-ms` *[v20.05.12.3]*
    Config used to give more time for Kafka batches to fill (in milliseconds).

      *Default: By default, this parameter is set to `10`.*

    #### `kafka-interceptor-classes` *[v21.09.17.2]*
    Config used to specify list of interceptor classes. It corresponds to Kafka’s `ProducerConfig.INTERCEPTOR_CLASSES_CONFIG.`
    
    #### `producer-max-block-ms` *[v22.07.19.7]*
    Corresponds to the [`max.block.ms` parameter of Kafka Producer](https://docs.confluent.io/platform/current/installation/configuration/producer-configs.html#max-block-ms).

      *Default: Default value is `60_000`.*

    #### `create-topic-timeout-ms` *[v22.07.19.7]*
    Specifies the timeout for topic creation.

      *Default: Default value is `60_000`.*

    #### `per-table-config` *[v20.12.04.6]*
    This configuration allows you to specify various properties for target tables on a per table basis like the following:
      <dl class="dl-indent">
       <dt><code>replication-factor</code> <i>[v21.12.02.6]</i></dt>
       <dd>Replication factor for data topics. For Kafka cluster setup, this defines the factor in which Kafka topic partitions are replicated on different brokers. We pass this config value to Kafka and Kafka drives the partition level replication.</dd>

      <dt><code>num-shards</code> <i>[v21.12.02.6]</i></dt>
       <dd>Number of partitions per data topic. By default this is set to a number of applier threads for getting the best possible scaling by allowing each individual applier thread to write to an independent partition of a Kafka topic.</dd>

      <dt><code>shard-key</code> <i>[v21.12.02.6]</i></dt>
       <dd>Shard key to be used for partitioning data topic.</dd>

      <dt><code>shard-function</code> <i>[v21.12.02.6]</i></dt>
       <dd>Sharding function to be used to deduce the partition allotment based on `shard-key` for all data topics. Values allowed are <code>MOD</code> and <code>NONE</code>.

      <i>Default: By default, this parameter is set to `NONE`, meaning Kafka will use it’s partitioning algorithm.</i></dd>
      </dl>
    
    Below is a sample config for `realtime` mode:

    ```YAML
    realtime:
      txn-size-rows: 1000
      before-image-format: ALL  # Allowed values : KEY, ALL
      after-image-format: ALL   # Allowed values : UPDATED, ALL
      kafka-compression-type: lz4
      shard-key: id
      num-shards: 1
      shard-function: MOD # Allowed values: MOD, NONE. NONE means storage will use its default sharding
      skip-tables-on-failures : false
      producer-max-block-ms: 60_000
      create-topic-timeout-ms: 100_000

      per-table-config:
      - tables:
          io_blitzz_nation:
            shard-key: id
            num-shards: 16 #default: 1
            shard-function: NONE
          io_blitzz_region:
            shard-key: id
          io_blitzz_customer:
            shard-key: custkey
            num-shards: 16
    ```

{{< hint "warning" >}}
**Attention:**
- During replication, Replicant stores metadata information related to replicated tables in a special topic with the prefix `replicate_io_replication_schema`. You can configure the replication factor and partitioning for this topic using the `replication-factor` and `num-shards` parameters respectively in [the `snapshot` section of the Applier configuration file](#parameters-related-to-snapshot-mode). _You must set these parameters for the metadata topic in [the `snapshot` section of your Applier configuration file](#parameters-related-to-snapshot-mode)_, even if you're operating in realtime mode. Metadata topic is common to `snapshot`, `realtime`, and `full` modes of Replicant. So its settings are included in the `snapshot` section.
 
  
  For more information about how different Replicant modes work, see [Running Replicant]({{< ref "docs/running-replicant" >}}).

- Replicant uses Kafka’s transactional API for writing data in batches to Kafka. Transactional API ensures exactly-once delivery semantics.

- Replicant doesn’t address realtime changes for views when replicating from the following databases to Kafka:

  - [Informix]({{< ref "docs/sources/source-setup/informix" >}})

  - [PostgreSQL]({{< ref "docs/sources/source-setup/postgresql" >}})
{{< /hint >}}

For a detailed explanation of configuration parameters in the applier file, see [Applier Reference]({{< ref "/docs/targets/configuration-files" >}} "Applier Reference").