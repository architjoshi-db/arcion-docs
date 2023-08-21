---
pageTitle: Reference for Extractor configuration parameters
title: Extractor Configuration
description: "Get detailed descriptions of all the available Extractor configuration parameters that you can use to configure Source databases in Arcion."
weight: 2
url: docs/references/extractor-reference
---

# Extractor Configuration

The Extractor configuration file contains all the parameters that Replicant uses while extracting data from the source database. While it is not necessary to modify most of the  parameters, you can adjust them to optimize the extraction as you need. You can find sample extractor configuration files for different databases inside the `conf/src` directory of [your Replicant self-hosted CLI download folder]({{< ref "../../quickstart/arcion-self-hosted#ii-download-replicant-and-create-a-home-repository" >}}). 

The configuration file can have three sections. Each corresponds to a type of replication.

- **`snapshot`**. Configurations for running in [snapshot mode]({{< ref "../../running-replicant#replicant-snapshot-mode" >}}). You must specify your configurations for the initial data capture under this section.
- **`delta-snapshot`**. Configurations for running in [delta-snapshot mode]({{< ref "../../running-replicant#replicant-delta-snapshot-mode" >}}).
- **`realtime`**. Configurations for running in [realtime]({{< ref "../../running-replicant#replicant-realtime-mode" >}}) and [full]({{< ref "../../running-replicant#replicant-full-mode" >}}) mode. For carrying out realtime replications, specify your requirements under this section.

## Snapshot Mode
Replicant can run in snapshot mode using the default Extractor configurations. Changing the snapshot configurations is therefore not necessary. But depending on the replication job and your requirements, you can adjust or specify the these parameters. This can aid in optimizing Replicant.

The following configuration parameters are available for snapshot mode. You can specify them under the `snapshot` section of the configuration file.

### `threads`
Maximum number of threads Replicant should use for writing to target.

### `fetch-size-rows` 
Maximum number of records or documents Replicant can fetch at once from the source system.

### `lock`

{{< hint "info" >}}
**Note:** This parameter is not relevant for sources such as MongoDB and Cassandra which don't support locking.
{{< /hint>}}

Option to do object locking on source. No locking is done by default. The following parameters are available to configure object locking:

| Option | Description | Allowed values |
|-----------|-------------|----------------|
|`enable` | Whether to enable object locking. | <ul><li>`true`</li><li>`false`</li></ul> <p>*Default: `false`* |
|`scope`| The scope of locking. |<ul><li>`TABLE`</li><li>`DATABASE`</li></ul> |
|`force`| Whether to force locking.| <ul><li>`true`</li><li>`false`</li></ul> <p>*Default: `false`* |
|`timeout-sec`| The time period in seconds to wait for the lock before throwing an exception. ||
      
### `min-job-size-rows` 
Replicant chunks tables/collections into multiple jobs for replication. This configuration specifies the minimum size for each such job. The minimum size specified has a positive correlation with the memory footprint of Replicant.

### `max-jobs-per-chunk`
The maximum number of jobs in a chunk. 

### `split-key`
Replicant uses this configuration to split the table/collection into multiple jobs in order to perform parallel extraction. The specified split key  column must be of numeric or timestamp type. 
{{< hint "info" >}} **Note:** We don't support `split-key`s over macro/procedure queries. Curerntly, we only support splitting jobs over `split-key`s for **tables** and **views**.
{{< /hint >}}
Splitting the work for source data extraction using the key provided here can significantly optimize Replicant if the following coniditions are met:

* The `split-key` has uniform data distribution in the table (and there is minimal data skew in the values of `split-key`)  .
* An index is present on `split-key` on the source system.

### `split-method`*[v20.05.12.3]*
Replicant supports two split methods:

<dl class="dl-indent">
<dt><code>RANGE</code></dt>
<dd>
Replicant splits the work in a range-based manner by uniformly distributing the split-key value ranges between the MIN and MAX values.
</dd>
<dt><code>MODULO</code></dt>
<dd>
The split key must be of numeric type for this split method. Each extraction job is assigned a <code>JobID</code> of <code>0</code> to <code>JOB-CNT -1</code>. Each job then pulls data from the source where <code>MOD(split-key, JOB-CNT) = JobID</code>.
</dd>

</dl>

### `extraction-method` *[v20.07.02.1]*
Replicant supports the following extraction methods: 

<dl class="dl-indent">
<dt><code>QUERY</code></dt>
<dd>
The default extraction method.
</dd>
<dt><code>TPT</code></dt>
<dd>
Stands for Teradata Parallel Transporter Utility (TPT). Supported only for Teradata as a source.
</dd>

<dt><code>CSVLOAD</code></dt>
<dd>
Extraction from the CSV files containing the data already exported from tables.
</dd>
<dt><code>DSBULK</code> <i>[v21.05.04.1]</i></dt>
<dd>
Extraction using the DataStax Bulk Loader (DSBulk) tool. Supported only for Cassandra.
</dd>
</dl>

### `enable-extraction-governor` *[v23.03.31.1]*
`true` or `false`

Whether to throttle the Extractor when memory consumption of Replicant hits threshold limit. Throttling prevents out of memory (OOM) errors and allows the Applier to catch up and free up  memory. 

If you enable this feature, it monitors the memory usage of Replicant. If Replicant's memory usage goes over 80%, the Extractor slows down. This allows the Applier threads to finish applying data to the target database and free up memory.

_Default: `false`._

### `extraction-governor-wait-ms` *[v23.03.31.1]*
Duration in milliseconds you want Extractor threads to sleep for. Use this parameter in conjunction with [`enable-extraction-governor`](#enable-extraction-governor-v2303311).

_Default: `100`._


### `tpt-num-files-per-job` *[v20.07.02.1]*
This parameter is only applicable when the `extraction-method` is `TPT`. It indicates how many CSV files should be exported by each TPT job (default value set to 16).
  
### `fetch-PK`
Option to fetch (and replicate) primary key constraints for tables. Default value is `true.`

###  `fetch-UK`
Option to  fetch ( and replicate) unique key constraints for tables. Default value is `true.`.

### `fetch-FK`
Option to fetch (and replicate) foreign key constraints for tables. Default value is `true.`.

### `fetch-indexes`
Option to fetch (and replicate) indexes for table. Default value is `true`.

### `fetch-user-roles`
Option to fetch (and replicate) user/roles. The default is `true` for homogeneous pipelines, but `false` otherwise.
  
### `normalize` *[v20.09.14.10]*
This parameter is only supported for MongoDB as a source. The configuration is used to configure the normalization of data. 

| Option | Description | Allowed values |
|-----------|-------------|----------------|
|`enable` | Whether to enable normalization.| <ul><li>`true`</li><li>`false`</li></ul> <p>*Default: `false`* |
|`de-duplicate`| Whether to de-duplicate data during normalization.|<ul><li>`REINIT`</li><li>`INLINE`</li></ul><p>*Default: `false`* |
|`extract-upto-depth`| The depth upto which the MongoDB document should be extracted.| *Default: `INT_MAX`*  |

###  `fetch-schemas-from-system-tables` *[v20.10.07.05]*
Option to use system tables to fetch schema information. By default, the value is `true`, and the option is enabled. If disabled, schemas need to be provided using `--src-schemas`.

### `allow-table-extraction-overlap` *[v23.03.31.1]*
`true` or `false`.

Controls whether or not multiple tables can overlap during extraction. If you set this parameter to `false`, Extractor extracts only one table at a time.

_Default: `true`._

### `fetch-create-sql`
`true` or `false`.

Whether to apply exact `CREATE SQL` on source to target. This parameter is only supported for Oracle-to-Oracle pipeline.

### `fetch-identity-info` *[v23.05.31.9]*
`true` or `false`.

Controls whether or not to replicate identity information of columns (auto-increment columns). If `true`, replication captures and replicates identity information of columns. If `false`, replication omits `AUTO_INCREMENT` (and all equivalent attributes depending on the storage) information while creating tables on the target database. You can also specify this parameter in a [per-table configuration](#per-table-config).

_Default: `true`._

#### Example
The following example captures identity column information for all tables except `example_table`:

```YAML
snapshot:
  threads: 16
  fetch-identity-info: true

  per-table-config:
  - catalog: testdb
    tables:
      example_table:
        fetch-identity-info: false
```

### `per-table-config`
You can use this section to override certain configurations in specific tables if necessary.

<dl class="dl-indent">
<dt><code>catalog</code></dt>
<dd>
The catlog name.
</dd>
<dt><code>schema</code></dt>
<dd>
The schema name.
</dd>

<dt><code>tables</code></dt>
<dd>
Multiple tables can be specified under this section using the following parameters:

<dl class="dl-indent">
<dt><code>TABLE_NAME</code></dt>
<dd>
Specify your table name here. Under the table name, specify your table-specific requirements:

- **`max-jobs-per-chunk`**.  Use this to control intra-table parallelism. Set it to `1` if there is no [`split-key`](#split-key) candidate in a given collection or table. For example, in MongoDB, no [`split-key`](#split-key) candidate has a uniform different data type across all rows or documents in a given collection.
- **`split-key`**. Use it to specify [`split-key`](#split-key) for this table.
- **`split-method`** *[v20.05.12.3]*. Use it to override the global [`split-method`](#split-methodv2005123) for this table.
- **`extraction-method`** *[v20.07.02.1]*. Use it to override the global [`extraction-method`](#extraction-method-v2007021) for this table.
- **`tpt-num-files-per-job`** *[v20.07.02.1]*. Use it to override the global [`tpt-num-files-per-job`](#tpt-num-files-per-job-v2007021) for this table.
- **`row-identifier-key`**. To specify a list of columns that uniquely identify a row in this table. We strongly recommend to specify a subset of columns as a `row-identifider-key` in the following conditions: 
  - If a table does not have a PK or UK defined.
  - If the table has a subset of columns that can uniquely identify rows in the table.
  
  Specifying an identifier can significantly improve the performance of incremental replication of this table.
- **`extraction-priority`** *[v20.09.14.1]*. Priority for scheduling extraction of this table. Higher value is higher priority. Both positive and negative values are allowed.
  _Default: `0`._
- **`normalize`** *[v20.09.14.10]*. Use it to override the global [`normallize`](#normalize-v20091410) parameter for this table.
- **`fetch-create-sql`**. Use it to override the global [`fetch-create-sql`](#fetch-create-sql) parameter for this table.
- **`fetch-identity-info`**. Use it to override the global [`fetch-identity-info`](#fetch-identity-info-v2305319) parameter for this table.
- **`fetch-PK`**. Use it to override the global [`fetch-PK`](#fetch-pk) parameter for this table.
- **`fetch-UK`**. Use it to override the global [`fetch-UK`](#fetch-uk) parameter for this table.
- **`fetch-FK`**. Use it to override the global [`fetch-FK`](#fetch-fk) parameter for this table.
- **`fetch-indexes`**. Use it to override the global [`fetch-indexes`](#fetch-indexes) parameter for this table.

</dd>
</dl>
</dd>
</dl>

You can configure as many tables as necessary and specify them under each other using the preceding format we discussed. For example, configuring two tables would look like the following:

```YAML
first_table:
  max-jobs-per-chunk:
  split-key:
  split-method:  
  extraction-method:
  tpt-num-files-per-job:
  row-identifier-key:
  extraction-priority:
  normalize: #Only for Mongo Database as source
    de-duplicate:
    extract-upto-depth:

second_table:
  max-jobs-per-chunk:
  split-key:
  split-method:
  extraction-method:
  tpt-num-files-per-job:
  row-identifier-key:
  extraction-priority:
  normalize: #Only for Mongo Database as source   
    de-duplicate:
    extract-upto-depth:               
```

## Heartbeat table

For real-time replication, you must create a heartbeat table. Replicant periodically updates this table at a configurable frequency. This table helps forcefully flush the CDC logs for all committed transactions so that Replicant can Replicate them. Notice the following:

- The table must be created in the catalog or schema that Replicant is going to replicate.
- The user configured for Replicant must have INSERT, DELETE, and UPDATE privileges to the heartbeat table.
- For simplicity, we recommend that you use the exact DDL in the Extractor configuration setup of your source database's documentation to create the heartbeat table.

You must specify the configurations for the heartbeat table under [the `realtime` section of the Extractor configuration file](#realtime-mode).

## Realtime mode

Unless you have given your heartbeat table different table and column names than the ones used in the provided command to create the table, the extractor configurations under the ```realtime``` section do not need to be changed. However, changing certain parameters may improve replication performance depending on the use case.

The following configuration parameters are available for realtime mode:

### `threads`
Maximum number of threads Replicant uses for realtime extraction.

### `fetch-size-rows`
Maximum number of records or documents Replicant can fetch at once from the source system.

### `fetch-duration-per-extractor-slot-s`
Number of seconds a thread should continue extraction from a given replication channel or slot. For example, in MongoDB source, a MongoDB shard is one replication channel. 

After a thread finishes extracting from a particular replication channel, it gets scheduled to process another replication channel. This option is relevant and important to avoid starvation from any replication channel when the number of threads provided is less than the number of replication channels.

### `heartbeat`
This parameter is for provisioning [a heartbeat table](#heartbeat-table) to the Replicant on the source system. 

You can create the heartbeat table with the following DDL:

```SQL
CREATE TABLE <catalog>.<schema>.arcion_io_cdc_heartbeat(timestamp <data_type_equivalent_to_long>)
```

Make sure that the user provided to Replicant has the INSERT, UPDATE, and DELETE privileges for this table.

The following parameters are available to configure heartbeat table:

<dl class="dl-indent">
<dt>enable</dt>
<dd>

`true` or `false`.

Whether to enable heartbeat table mechanism. You must set this to true for realtime replication.

</dd>

<dt>

`catalog`

</dt>
<dd>

Catalog of the heartbeat table.

</dd>
<dt>

`schema`

</dt>
<dd>

Schema of the heartbeat table.

</dd>

<dt>

<code>table-name</code> *[v20.09.14.3]*

</dt>
<dd>

Name of the heartbeat table.

</dd>

<dt>

`column-name` *[v20.10.07.9]*
</dt>
<dd>

Name of column in heartbeat table (has only one column).

</dd>

<dt>

`interval-ms`
</dt>
<dd>

Interval at which Replicant should update heartbeat table with the latest timestamp (milliseconds since epoch).
</dd>

</dl>

### `fetch-interval-s` *[v20.07.16.1]*
Interval in seconds after which Replicant tries to fetch the CDC log.
{{< hint "info" >}}
Not all realtime sources support this parameter.
{{< /hint >}}

### `start-position` *[v20.09.14.1]*
Specifies the starting log position for realtime replication. The structure for providing start positions varies for different databases.

{{< tabs "start-position-for-dbs" >}}
{{< tab "IBM Db2" >}}

### Db2 with MQ
#### `commit-time`
Timestamp from source Db2 MQ in UTC. For example, the following query will give the timestamp in UTC:
```SQL
SELECT CURRENT TIMESTAMP - CURRENT TIMEZONE AS UTC_TIMESTAMP FROM SYSIBM.SYSDUMMY1
```

For more information, see [the Db2 MQ tab in Parameters related to realtime mode]({{< ref "../source-setup/db2/db2_mq_kafka#parameters-related-to-realtime-mode" >}})


### Db2 with Kafka
#### `start-offset`
Specifies the timestamp for source Db2 Kafka. The following values are possible for `start-offset`: 

- `NONE`
- `EARLIEST`
- `LATEST`

For more information, see [the Db2 Kafka tab in Parameters related to realtime mode]({{< ref "../source-setup/db2/db2_mq_kafka#parameters-related-to-realtime-mode" >}})
{{< /tab >}}

{{< tab "Informix" >}}
#### `sequence-number`
`long` type value. 

Specifies the start position from which replication should start.

#### `timestamp-ms` 
`long` type value. Causes Replicant to discard all transactions that were committed before this timestamp.

#### `create-checkpoint` 
`boolean` value.

Creates a replication checkpoint.
{{< /tab >}}

{{< tab "MySQL" >}}
#### `log`:
Log file from where replication should start.
#### `position`
Position within the log file from where replication should start.
#### `start-timestamp` _[v23.06.30.2]_
Specifies the timestamp value from where Replicant starts replication. The timestamp follows the format `YYYY-MM-DD hh:mm: z`, where `z` stands for the time zone—for example, `PST`, `UTC`, or `IST`.
#### `rewind-realtime-start-position-m` _[v23.06.30.2]_
This parameter works together with the [`log`](#log) and [`position`](#position) parameters. It rewinds the `start-position` by the value you specify here and starts replication from this new `start-position`.
{{< /tab >}}

{{< tab "MongoDB" >}}
#### `timestamp-ms`
Timestamp in milliseconds from where replication should start. This corresponds to the timestamp field `ts` in `optime`. Note that `ts` contains timestamp in seconds which needs to be multiplied by 1000.

#### `increment`
Optional parameter. 

Specifies the increment for the given timestamp. It corresponds to [the increment section in the `ts` field of `optimes`](https://www.mongodb.com/docs/manual/reference/command/replSetGetStatus/#mongodb-data-replSetGetStatus.optimes).
{{< /tab >}}

{{< tab "Oracle" >}}
#### `start-scn`
The SCN from which replication should start.
{{< /tab >}}

{{< tab "PostgreSQL" >}}
#### `start-lsn`
An Log Sequence Number-based (LSN) starting position for PostgreSQL—for example, `0/3261270`. Replicant starts replicating from `start-lsn`, rather than the current log position when you trigger Replicant in real-time mode, provided that the replication slot still has the LSN visible.
{{< /tab >}}

{{< tab "Others" >}}
#### `timestamp-ms`
Timestamp from which replication should start.
{{< /tab >}}
{{< /tabs >}}

### `idempotent-replay` *[v20.09.14.1]*
This parameter can have the following possible values:

- **`ALWAYS`**. Means always do INSERT as REPLACE.
- **`NONE`**. Means publish operation as is.
- **`NEVER`**. Default value.

### `normalize` *v[20.09.14.12]*
This parameter is only supported for MongoDB as a source. It configures the normalization of data.

| Option | Description | Allowed values |
|-----------|-------------|----------------|
|`enable` | Whether to enable normalization.| <ul><li>`true`</li><li>`false`</li></ul> <p>*Default: `false`* |
|`de-duplicate`| Whether to de-duplicate data during normalization.|<ul><li>`REINIT`</li><li>`INLINE`</li></ul><p>*Default: `false`* |
|`extract-upto-depth`| The depth upto which the MongoDB document should be extracted.| *Default: `INT_MAX`*  |

### `fetch-identity-info` *[v23.05.31.9]*
`true` or `false`.

Controls whether or not to replicate identity information of columns (auto-increment columns). If `true`, replication captures and replicates identity information of columns. If `false`, replication omits `AUTO_INCREMENT` (and all equivalent attributes depending on the storage) information while creating tables on the target database.

_Default: `true`._

{{< hint "warning" >}}
**Important:** In `realtime` mode, `fetch-identity-info` only applies with [DDL replication]({{< relref "../ddl-replication" >}}). For example, when `ALTER TABLE ADD COLUMN...`  occurs and the new column is an identity column.
{{< /hint >}}

#### Example
The followigng example ignores identity information only during CDC replication with DDLs:

```YAML
snapshot:
  threads: 16
  ...

realtime:
  fetch-identity-info: false 
```

### `per-table-config`
You can use this section to override certain configurations in specific tables if necessary. It follows [the same structure as described in the `per-table-config` of snapshot mode](#per-table-config).

The following is a sample table-specific configuration for realtime MongoDB source:

```YAML
per-table-config:
- schema: tpch
  tables:
    lineitem:
      normalize:
        extract-upto-depth: 3
```

## Delta-snapshot mode

Arcion supports a third mode of replication called `delta-snapshot`. Delta-snapshot is required when the source database does not provide access to CDC logs but the customer is interested in realtime replication—for example, Teradata. The delta-snapshot is a recurring snapshot which replicates the *delta* of the records which have been inserted or updated since the previous delta-snapshot iteration. The following describes parameters of the `delta-snapshot` section of the Extractor configuration file.

### `threads`
Maximum number of threads Replicant should use for writing to target.

### `fetch-size-rows` 
Maximum number of records or documents Replicant can fetch at once from the source system.

### `lock`

{{< hint "info" >}}
**Note:** This configuration is not relevant for sources such as MongoDB, Cassandra which do not support locking.
{{< /hint>}}

Option to do object locking on source. No locking is done by default. The following parameters are available to configure object locking:

| Option | Description | Allowed values |
|-----------|-------------|----------------|
|`enable` | Whether to enable object locking. | <ul><li>`true`</li><li>`false`</li></ul> <p>*Default: `false`* |
|`scope`| The scope of locking. |<ul><li>`TABLE`</li><li>`DATABASE`</li></ul> |
|`force`| Whether to force locking.| <ul><li>`true`</li><li>`false`</li></ul> <p>*Default: `false`* |
|`timeout-sec`| The time period in seconds to wait for the lock before throwing an exception. ||
      
### `min-job-size-rows` 
Replicant chunks tables/collections into multiple jobs for replication. This configuration specifies the minimum size for each such job. The minimum size specified has a positive correlation with the memory footprint of Replicant.

### `max-jobs-per-chunk`
The maximum number of jobs in a chunk. 

### `split-key`
Replicant uses this configuration to split the table/collection into multiple jobs in order to perform parallel extraction. The specified split key  column must be of numeric or timestamp type. 
{{< hint "info" >}} **Note:** We don't support `split-key`s over macro/procedure queries. Curerntly, we only support splitting jobs over `split-key`s for **tables** and **views**.
{{< /hint >}}
Splitting the work for source data extraction using the key provided here can significantly optimize Replicant if the following coniditions are met:

* The `split-key` has uniform data distribution in the table (and there is minimal data skew in the values of `split-key`)  .
* An index is present on `split-key` on the source system.

### `split-method` *[v20.05.12.3]*
Replicant supports two split methods:

<dl class="dl-indent">
<dt><code>RANGE</code></dt>
<dd>
Replicant splits the work in a range-based manner by uniformly distributing the split-key value ranges between the MIN and MAX values.
</dd>
<dt><code>MODULO</code></dt>
<dd>
The split key must be of numeric type for this split method. Each extraction job is assigned a <code>JobID</code> of <code>0</code> to <code>JOB-CNT -1</code>. Each job then pulls data from the source where <code>MOD(split-key, JOB-CNT) = JobID</code>.
</dd>

</dl>

### `extraction-method` *[v20.07.02.1]*
Replicant supports the following extraction methods: 

<dl class="dl-indent">
<dt><code>QUERY</code></dt>
<dd>
The default extraction method.
</dd>
<dt><code>TPT</code></dt>
<dd>
Stands for Teradata Parallel Transporter Utility (TPT). Supported only for Teradata as a source.
</dd>

<dt><code>CSVLOAD</code></dt>
<dd>
Extraction from the CSV files containing the data already exported from tables.
</dd>
<dt><code>DSBULK</code> <i>[v21.05.04.1]</i></dt>
<dd>
Extraction using the DataStax Bulk Loader (DSBulk) tool. Supported only for Cassandra.
</dd>
</dl>

### `tpt-num-files-per-job` *[v20.07.02.1]*
This parameter is only applicable when the `extraction-method` is `TPT`. It indicates how many CSV files should be exported by each TPT job (default value set to 16).

###  `delta-snapshot-key`
Tables requiring incremental replication must have a NON-NULL numeric or timestamp column. This column gets updated on each insert or update on each row of that table. The value of this column must be monotonically increasing and non-repeatable. We call such a column a `delta-snapshot-key`. This parameter lets you specify that key. Replicant uses this column to perform its incremental replication for each table being replicated that has this column (unless you override this parameter in the `per-table-config` for this table). 

{{< hint "warning" >}}
`delta-snapshot-key` is deprecated. Please use [`delta-snapshot-keys`](#delta-snapshot-keys-v2112021) instead.
{{< /hint >}}

###  `delta-snapshot-keys` *[v21.12.02.1]*
This parameter lets you specify one or more [delta-snapshot keys](#delta-snapshot-key).

Each column in this list  acts as an individual [`delta-snapshot-key`](#delta-snapshot-key). Updating on any of the columns in this list will trigger replication. For example:

```YAML
delta-snapshot-keys: [col1, col2, col3]`
```

###  `row-identifier-key`
This parameter lets you specify a global `row-identifier-key`. You can override this configuration using [per-table-config](#per-table-config-2) for this table).

If a table does not have a PK or UK defined on it, then we strongly recommend that you specify a `row-identifier-key`. This is a single column or a group of columns that are guaranteed to be unique in the table by your applications. Arcion leverages this key to achieve a much better overall performance for incremental replication (in the absence of PK or UK). 

###  `update-key` 
This lets users specify a key that Replicant should use to perform deletes or updates on the target system under the following scenarios: 

- PK or UK does not exist.
- There's no unique `row-identifier-key` present in the table.

This specifies a single column or a group of columns for Replicant to use.  We strongly recommended that you create an index on `update-key` on the target table explicitly to get better replication performance.

###  `delta-snapshot-interval`
The interval between two incremental replication cycles in seconds. 

This parameter allows you to specify how frequently Replicant should query the source database and pull incremental changes.

###  `replicate-deletes`
This parameter allows you to disable delete replication. 

###  `delta-snapshot-delete-interval`
This parameter allows you to specify a different interval for delete replication that the one specified for insert or update incremental replication.

###  `native-extract-options`
This parameter allows you to specify the following options for native extraction:

| Option | Description | Allowed values |
|-----------|-------------|----------------|
|  `charset` | The character set to use with native extraction method. | <ul><li>`ASCII`</li><li>`UTF8`</li></ul>  |
| `compression-type` | The type of compression to use with native extraction method. | `GZIP` |

### `column-size-map` *[v20.08.13.9]*
This parameter lets users specify the column size or length to use while extracting data.

### `per-table-config`
You can use this section to override certain configurations in specific tables (or views, queries) if necessary. It follows the same structure as described in the `per-table-config` of [snapshot mode](#per-table-config) and [realtime mode](#per-table-config-1).

The following is a sample table-specific configuration for Teradata delta-snapshot source:

```YAML
per-table-config:
- schema: tpch
  tables:
    testTable:
      split-key: split-key-column 
      extraction-method: TPT 
      tpt-num-files-per-job: 16
      extraction-priority: 1
      native-extract-options:
        charset: "UTF8"
        column-size-map:
          "COL1": 2
          "COL2": 4
          "COL3": 3
        compression-type: "GZIP"
      delta-snapshot-keys: [col1, col2, col3] 
      row-identifier-key: [col1, col2]
      update-key: [col1, col2]
```