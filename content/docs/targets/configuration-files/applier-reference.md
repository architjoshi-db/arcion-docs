---
pageTitle: Reference for Applier configuration parameters
title: Applier Configuration
description: "Learn about all the Applier configuration paramters available to configure Target databases in Arcion."
weight: 1
url: docs/references/applier-reference
---
# Applier Configuration

The Applier configuration file contains all the parameters that Replicant uses while loading data on to the Destination database. While it is not necessary to modify most of the  parameters, they can be adjusted to optimize the Applier job as necessary. The sample Applier configuration file is located in the Replicant release download folder. The path to the sample Applier configuration file in the release folder is: `conf/dst/target_database_name.yaml` The sample file is broken up into two sections- snapshot and realtime. The Applier configurations for the initial data capture must be specified under `snapshot` and the configurations for realtime replication must be specified under `realtime`

## Snapshot Mode

Replicant can run in snapshot mode using the default Applier configurations. Changing the snapshot configurations is therefore not necessary. Depending on the replication job, however, adjusting or specifying the parameters described below may aid in optimizing Replicant.

### `threads`
Maximum number of threads Replicant should use for writing to target.

### `batch-size-rows`
This configuration determines the size of a batch. We recommend that you both refer to the value provided in the sample extractor configuration file of the Arcion Replicant release folder and also experiment a bit on your deployment to find the appropriate value here. For example, a typical size of 10000 offers good performance for MongoDB, but you should tune it depending on your use case and target system.

### `txn-size-rows`
Determines the unit of the Applier-side job size. A transaction consists of multiple batches.

### `bulk-load`
Arcion Replicant can leverage the underlying support of a FILE/PIPE based bulk loading into the Target system. You can configure bulk loading using the following parameters:

| Parameter name | Allowed values | Description |
|-----------|-------------|----------------|
| `enable`  | `true` or `false` | Whether to enable or disable bulk loading.  |
| `type` | `FILE` or `PIPE` |  The type of bulk loading. |
| `serialize` | `true` or `false` | Enables generated files to be applied in a serial/parallel fashion. |
| `native-load-configs`*[v20.09.14.3]*  | LOAD config string | LOAD config string from the user. These will be appended to the target specific `LOAD SQL` command. |
|`enable-archive`*[v21.09.17.1]*  | `true` or `false` |Whether to archive data files of last iterations on disk. You can use this config when bulk loading is enabled and `type` is set to `FILE`. |
| `archive-dir`*[v21.09.17.1]* | Directory path, for example `"/home/file-archive"` | Directory path where Replicant will archive data files. Without specifying, Replicant will use the default project data path as the archive directory if `enable-archive` is set to `true`. |
|`compression-type` *[v21.09.17.1]*  |  `"GZIP"`  | The file compression type to compress the CSV files to be loaded on to Target. |


### `handle-failed-opers`
`true` or `false`.

Whether to handle failure to load rows, tables, and/or operations on the Target.

If `true`, Replicant will write to a version table or a CSV file when it fails to load rows, tables, and/or operations on the Target.

### `use-quoted-identifiers`
`true` or `false`. 

If `false`, Replicant will avoid quoting catalog, schema, table, view, and column names while creating and accessing them.

### `skip-tables-on-failures`
`true` or `false`. 

Enabling this parameter will force Replicant to skip a table/collection that Replicant is unable to load on to the Target even after multiple attempts. Instead, Replicant will continue replicating other tables.

### `deferred-delete`
`true` or `false`. 

When enabled, Replicant will create an additional column on each Target table to mark the deletes instead of actually deleting records from the tables.

{{< hint "info" >}}
**Note:** This parameter is relevant only for incremental replication. It's irrelevant for full replication based on snapshot or CDC. 
{{< /hint >}}

### `schema-dictionary`
Cntrols dumping of schemas. It can have any one of the following values:

- `NONE`: Default value. This option allows dumping the schema into a dedicated schema dictionary table on the Target like  `replicate_io_replication_schema`.
- `SCHEMA-DUMP`: With this, Replicant dumps the exact schema as it fetched from the Source database and maps to the Target for each table being replicated, in a YAML format.
- `POJO`: With this, Replicant dumps the exact Java class definition per topic that should be used to deserialize all the topic messages into POJOs.

{{< hint "info" >}}
**Note:** This is supported for selective targets only.
{{< /hint >}}

### `per-table-config`
Allows you to specify various properties for specific tables on the Target database. The can configure the following properties under this parameter:

- `table-type`: Type of table (e.g. `REFERENCE` in case of SingleStore).
- `table-store`: Table store to use. For example, `ROW` or `COLUMN`.
- `sort-key`: Sort key to be created for a table (if applicable for Target).
- `shard-key`: Shard key to be created for a Target table.
- `rowstore-key` *[v21.06.14.9]*: Rowstore-key/index to be created for a table (if applicable for Target).

You can also configure bulk loading for specific tables under `per-table-config`. To know about the available bulk loading parameters, see [`bulk-load`](#bulk-load).

### `user-role`
For creating user roles. It has the following parameters:

* `init-user-role`: `true` or `false`. 
    
    Whether to create user/role on the Target database. By default, this is `true` for homogeneous pipelines (Source and Target being similar), `false` otherwise.
* `default-password`: Specify the default password.
* `ldap-auth-type`: The LDAP authentication type to use. Only applicable for MongoDB Atlas as Target.
* `x509-type`: The x.509 certificate type. Only applicable for MongoDB Atlas as Target.

### `init-indexes`
`true` or `false`. 

Enabling this allows Replicant to create indexes on Target database. Default value is `true`.

### `init-indexes-post-snapshot`
`true` or `false`. 

Enabling this allows Replicant to create indexes after the snapshot is complete. If disabled, Replicant creates indexes prior to the snapshot. 

*Default value is `true`.*

### `init-constraint-post-snapshot`
Enabling this allows Replicant to create constraints and indexes after the snapshot is complete.

### `denormalize` *[v21.04.06.1]*
Controls enabling denormalization in the database. It has only one parameter:

* `enable`: `true` or `false`. 

    Enable or disable denormalization. This parameter is only supported for MongoDB as a Source. You must specify the denormalized JSON query via the `--src-queries` argument for the Source relational database.

### `use-upsert-based-recovery` *[v22.11]*
`true` or `false`.

Whether to enable upsert-based recovery for snapshot mode.

This parameter controls Replicant's behavior for recovery. By default, upon resuming from a crash, Replicant ignores the completed jobs and deletes any uncommitted or partially executed jobs. Then it goes on to execute those remaining jobs. 

Delete operation is expensive and slows down operations in most databases. We can get past this by skipping the delete operation entirely, without violating primary or unique key constraints. Replicant achieves this by performing upsert operations to complete the uncommitted jobs.

If `use-upsert-based-recovery` is set to `true`, Replicant restarts the partially executed jobs on the Extractor side, while the Applier performs upsert operations on rows in the target tables.

{{< hint "info" >}}
**Note:** Arcion Replicant supports upsert-based recovery for the following target databases:
- [MySQL]({{< ref "../target-setup/mysql" >}})
- [PostgreSQL]({{< ref "../target-setup/postgresql" >}})
- [SingleStore]({{< ref "..//target-setup/singlestore" >}})
  
Upsert-based recovery doesn't work in the following situations:

- The target database doesn't support upsert operation.
- A table doesn't have a candidate key (primary or unique key).

In these situations, Replicant falls back to the default behavior for recovery.
{{< /hint >}}

## Realtime Mode
Replicant can run in realtime mode using the default configurations. But changing certain parameters may improve real time replication performance depending on the use case. The following configuration parameters are available for realtime mode:

### `threads`
Maximum number of threads Replicant should use for writing to Target.

### `batch-size-rows`
In realtime operations, insert/update/deletes are batched together and applied to Target. This parameter determines the size of the batch. For example, typical size of `10000` offers good performance for MongoDB, but you should tune it depending on your use case and Target system.

### `txn-size-rows`
Determines the unit of Applier side job size. A transaction consists of multiple batches.

### `handle-failed-opers`
`true` or `false`. 

Whether to handle failure to load rows, tables, and/or operations on the Target.

If `true`, Replicant will write to a version table or a CSV file when it fails to load rows, tables, and/or operations on the Target.

### `use-quoted-identifiers`
`true` or `false`.

If `false`, Replicant will avoid quoting catalog, schema, table, view, and column names while creating and accessing them. 

{{< hint "warning" >}}
**Important:** The [same parameter is available in snapshot mode](#use-quoted-identifiers). If you set this parameter in realtime mode as well, make sure they both have the same value (both `true` or both `false`).
{{< /hint >}}

### `before-image-format`
This indicates which columns should be included in the WHERE part of the UPDATE and DELETE operations. Allowed values are:

 - `KEY` (Default value)
 - `ALL`

### `after-image-format`
This indicates which columns should be included in the SET part of the UPDATE operation. Allowed values are:

- `UPDATED` (Default value)
- `ALL`

### `retry-transactions` *[v20.06.01.2]* 
`true` or `false`.

{{< hint "info" >}}
**Note:** The default value of this parameter is `true` for target databases supporting ACID transactions (except MongoDB). Otherwise, the default is `false`.
{{< /hint >}}

With this set to `true`, Replicant tries each real-time transaction again in the event of failures. The number of retries and wait duration between each retry depends on the connection configuration of the Target system.

### `retry-failed-txn-idempotently` *[v20.09.14.8]*
`true` or `false`.

With this set and `retry-transactions` set to `true`, Relicant retries each real-time transaction idempotently on failure.

### `replay-consistency` *[v20.09.14.1]*
Indicates the type of transactional consistency. The following values are possible:

  <dl class="dl-indent">

  <dt><code>GLOBAL</code></dt>
  <dd> Real-time replication is performed with global transactional consistency.

  <dt><code>EVENTUAL</code></dt>
  <dd>
  <i>Default value.</i><p>Real-time replication is performed with eventual consistency.<p>
  </dd>

  </dl>

### `skip-upto-cursors` *[v20.09.14.1]*
{{< hint "info" >}}
**Note:** This parameter applies only [if `replay-consitency` is set to `GLOBAL`](#replay-consistency-v2009141). 
{{< /hint >}}

Here, you can specify a list of cursor positions up to which replication must be skipped. It may not always be possible to persist the operations of a failed transaction in the `failed_txn` table of metadata storage (see [`--skip-failed-txn` in Various Replication Options Explanation](../../running-replicant/#various-replication-options-explanation) for more details). In that case, Replicant logs the operations in a text file. The text file is located in the following path:

```sh
<Replicant_home>/data/<Replicant ID>/bad_rows replicate_io_failed_txn_log_<tableID/extractorID>. 
```

The user gets notified of this file location through notification mails and trace logs. The file contains the failed operations as well as the `skip-upto-cursor`(s) configuration. After resolving the failure, you can use this parameter to skip over the failed transactions.

### `replay-shard-key-update-as-delete-insert` *[v20.12.04.7]*
Allows replay of update operation that changes values of shard key columns as delete + inserts. The following values are possible for this parameter:

- `ON`
- `OFF`

This is `ON` by default for SingleStore as a Target.

### `per-table-config`
This configuration allows you to specify various properties for specific target tables.

- `skip-upto-cursor` *[v20.09.14.1]*: Similar to `skip-upto-cursors`. Use this to specify a cursor upto which replication must be skipped for a given table.

### `skip-tables-on-failures`
`true` or `false`.

Enabling this parameter will force Replicant to skip a table/collection that Replicant is unable to load on to the Target even after multiple attempts. Instead, Replicant will continue replicating other tables.

### `replay-replace-as-upsert` *[v22.11]*
`true` or `false`.

Whether to enable upsert-based recovery when [operating in full mode]({{< ref "../../running-replicant#replicant-full-mode" >}}).

It controls how Replicant replays replace operations to address realtime changes in [full mode replication]({{< ref "../../running-replicant#replicant-full-mode" >}}). 

For example, some insert operations can occur during the snapshot phase. Replicant's default behavior in this case is replaying replace operation by performing delete and then insert. This slows down replication in many cases. If you set `replay-replace-as-upsert` to `true`, Replicant replays replace operation using upsert.

{{< hint "info" >}}
**Note:** Arcion Replicant supports upsert-based recovery for the following target databases:
- [MySQL]({{< ref "../target-setup/mysql" >}})
- [PostgreSQL]({{< ref "../target-setup/postgresql" >}})
- [SingleStore]({{< ref "../target-setup/singlestore" >}})
  
Upsert-based recovery doesn't work in the following situations:

- The target database doesn't support upsert operation.
- A table doesn't have a candidate key (primary or unique key).

In these situations, Replicant falls back to the default behavior for recovery.
{{< /hint >}}

### `cdc-metadata-type`
This parameter allows you to add extra information columns to the CDC row.

Support for `cdc-metadata-type` possesses the following limitations: 
- `cdc-metadata-type` works on sources that support CDC.
- `cdc-metadata-type` works in [`realtime`]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}) and [`full`]({{< ref "docs/running-replicant#replicant-full-mode" >}}) modes.

Arcion supports this parameter for the following targets:

- [Databricks]({{< ref "docs/targets/target-setup/databricks" >}})
- [Snowflake]({{< ref "docs/targets/target-setup/snowflake" >}})

You can set `cdc-metadata-type` to one of the following values:

<dl class="dl-indent">
<dt>

`NONE`
</dt>
<dd>

Default value of `cdc-metadata-type`. CDC works in the normal manner.
</dd>

<dt>

`TYPE2_CDC`</dt>
<dd>

With this value, all operations become append only and Arcion uses Type-2 CDC. For more information, see [Type-2 CDC]({{< ref "docs/references/type-2-cdc" >}}).

</dd>

<dt>

`ADD_METADATA_CDC`</dt>
<dd>
With this value, insert, update, and delete operations work in the normal manner but each row contains two additional fields: 

- **`ARCION_SOURCE_EXTRACTION_TIMESTAMP`**.  Time when Replicant detects the DML from logs.
- **`ARCION_SOURCE_OPERATION_TYPE`**. Type of the operation (INSERT, UPDATE, or DELETE). Delete operation deletes the row.

Each update operation updates the preceding fields and insert operation inserts a new row with the preceding fields.
</dd>