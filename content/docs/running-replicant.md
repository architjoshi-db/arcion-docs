---
pageTitle: Using the Arcion Replicant CLI 
title: Running Replicant
description: "Explore the Arcion Replicant CLI, its different modes, and replication options. Learn how to fetch or infer schemas, how to encrypt Replicant, and more."
weight: 2
---
# Running Replicant

Replicant must be run in one of three replication modes: full, snapshot, realtime, and delta-snapshot. When starting Replicant, you must specify your desired mode of replication using a command line argument (`full`, `realtime`, or `delta-snapshot`). In addition to the multiple different modes, Replicant can also be run with additional settings/options. All of the modes, options, and commands to run Replicant are explained below.


## Replicant full mode

**With Basic Configurations**

Enter the following command to run Replicant in full mode with only minimal configurations:
```BASH
./bin/replicant full conf/conn/source_database_name_src.yaml \
conf/conn/target_database_name.yaml \
--extractor conf/src/source_database_name.yaml \
--filter filter/source_database_name_filter.yaml
```
**With Advanced Configurations**

Enter the following command to run Replicant in full mode with advanced configurations:
```BASH
./bin/replicant full conf/conn/source_database_name.yaml \
conf/conn/target_database_name.yaml \
--extractor conf/src/source_database_name.yaml \
--applier conf/dst/target_database_name.yaml \
--notify conf/notification/notification.yaml \
--statistics conf/statistics/statistics.yaml \
--metadata conf/metadata/database_name.yaml \
--filter filter/source_database_name_filter.yaml \
--id repl1 --replace --overwrite
```  

In full mode, Replicant transfers all existing data from the source to the target database setup with a one-time data snapshot. Replicant first creates the destination schemas after that is complete, Replicant transfers the existing data from the source to the destination. Additionally, Replicant will continue synchronizing the destination with the source, even after the snapshot is completed.

As soon as the snapshot data movement is done, Replicant will seamlessly transition from snapshot migration to continuous replication. Once the smooth transition is ensured, Replicant will start listening for incoming changes in the source database using log-based CDC.

Finally, Replicant in full mode can either be run with only the bare minimum required configurations which are outlined in the `source and target database setup instructions`, or it can be run with the advanced configurations, outlined in `additional replicant configurations` setup instructions.

**Note**: Replicant shows various useful replication statistics in the dashboard while the replication is in progress.


## Replicant snapshot mode

Use the following command to run Replicant in snapshot mode:
```Bash
./bin/replicant snapshot \
 conf/conn/source_database_name_src.yaml \
 conf/conn/target_database_name_dst.yaml \
 --extractor conf/src/source_database_name.yaml \
 --applier conf/dst/target_database_name.yaml  \
 --filter filter/source_database_name_filter.yaml \
 --id repl2 --replace –overwrite
```

In snapshot mode, Replicant first creates the destination schemas, just as in full mode. Once the schemas are created, Replicant captures all the existing data from the source and transfers it to the destination, also known as Replicant's data snapshot. Once all data has been moved to the destination, a summary file will be generated and sent in an email notification if you have configured Replicant to do so. After finishing the snapshot, Replicant will immediately shut down.


## Replicant realtime mode

Use the following command to run Replicant in realtime mode:
```Bash
./bin/replicant realtime conf/conn/source_database_name_src.yaml \
conf/conn/target_database_name_dst.yaml \
--extractor conf/src/source_database_name.yaml \
--applier conf/dst/target_database_name.yaml  \
--filter filter/source_database_name_filter.yaml \
--id repl2 --replace –overwrite
```

In real-time mode, replicant first creates the destination schemas if they are not already present. If the destination schemas are present, Replicant  appends to the existing tables. In real-time mode Replicant starts replicating real-time operations obtained from log-based CDC. By default, real-time mode starts replicating from latest log position, but a custom start position can be specified by the user in real-time section of extractor configuration file.

## Replicant delta-snapshot mode

Use the following command to run Replicant in delta snapshot mode:

```BASH
/bin/replicant delta-snapshot \
conf/conn/source_database_name_src.yaml \
conf/conn/target_database_name_dst.yaml \
--extractor conf/src/source_database_name.yaml \
--applier conf/dst/target_database_name.yaml  \
--filter filter/source_database_name_filter.yaml \
--id repl2 --replace –overwrite
```

The delta snapshot is a recurring snapshot which replicates the *delta* of the records which have been inserted/updated since the previous delta snapshot iteration. In this mode, Replicant uses the delta-snapshot key column and the recovery table to identify the set of delta records which have been inserted/updated/deleted since the previous delta snapshot iteration. 

To know how you can specify delta snapshot parameters in Extractor configuration file, see [Delta Snapshot Mode in Extractor Configuration]({{< ref "docs/sources/configuration-files/extractor-reference#delta-snapshot-mode" >}}).

## Replicant initialization mode

Use the following command to run Replicant in init mode:
```BASH
./bin/replicant init conf/conn/source_database_name_src.yaml \
conf/conn/target_database_name_dst.yaml
```

In init mode, Replicant will retrieve the existing source schemas and create equivalent schemas on the destination.


## Fetch-schemas

Replicant can fetch schemas to analyze the current contents of a source or destination.

To view the current contents, start Replicant with:
```BASH
./bin/replicant fetch-schemas <conn_config_file>
```
Doing so will generate a file named schemas.yaml in the current directory, containing descriptions of all tables.

By, providing an option --output-file <output_path> you can change the default destination for the schemas file. You can also fetch the Filter configuration using  `--filter <filter_file>`  
  * **Note** : When a filter file is fetched only whitelisted content is considered

Once the schema is fetched, it is possible to modify the file to specify custom selectSql expressions. The modified file can then be specified to replicant through `--src-schemas switch` to Replicant.

## Infer-schemas

Inferring schemas is the process of fetching a schema from the source database and conforming it to the destination database.

To infer schemas, user should start replicant with:
```BASH
./bin/replicant infer-schemas conf/conn/database_name> <dst_type>
```
For example, for the command  `./bin/replicant infer-schemas conf/conn/oracle_src.yaml ORACLE `, Replicant will fetch schemas from the source Oracle database and modify them so that they conform to the target Oracle database.

Before transferring the database content, it is recommended to examine the schemas on the destination and tailor them to the your specific needs by inferring schemas. Such modified inferred schemas file can be supplied to replicant through `--dst-schemas switch`.

## Write modes

If a collision occurs at the destination system, Replicant by default warns the user and exits with an error to preserve the existing data at the destination. If probability of collision exists for some data, you can resolve the possible error by providing the appropriate schemas file for the target database.

Instead of providing a schemas file, you can specify a global rule when you start Replicant. These rules dictate different modes of writing data to the target database. You can specify a write mode by using the corresponding CLI flag. 


### CLI flags
The following table lists the supported write modes and the corresponding Replicant CLI flags. Use the CLI flag when you run Replicant to enable a particular write mode.

| Write mode    | CLI flag                |
| -----------   | -----------             |
| `APPEND`      | `--append-existing`     |
| `MERGE`       | `--merge-existing`      |
| `REPLACE`     | `--replace-existing`    |
| `SWAP`        | `--swap-existing`       |
| `TRUNCATE`    | `--truncate-existing`   |

### How write modes work

`APPEND`
: Replicant appends the data from the source to the existing data at the destination.

`MERGE` _[v21.06.14.9]_
: If the table exists on the destination database, Replicant merges the source data with the existing destination data _if_ the table has primary key. For tables without primary keys, `--merge-existing` behaves like `--truncate-existing`. 

  `--merge-existing` also preserves destination table schemas.

`REPLACE`
: If the table exists on the destination, then Replicant recreates the table and replaces the destination data with the source data.

`SWAP` _[v23.08.31.1]_
: 
  {{< hint "info" >}}
  **Note:** `SWAP` write mode is only supported for [Snowflake target]({{< ref "docs/targets/target-setup/snowflake" >}}).
  {{< /hint >}}

  This write mode performs the following steps:

  1. Replicant creates a temporary table on the target system for each table in the user's [filter]({{< ref "docs/sources/configuration-files/filter-reference" >}}) instead of the actual table.
  2. The snapshot process inserts the data into these temporary tables.
  3. When the snapshot process completes, Replicant performs two things:

     a. Replicant drops the actual table.
     
     b. Replicant renames the temporary table to the actual table. Therefore, the temporary table becomes the current live table.
  4. Real-time replication then starts normally in [`full` replication mode](#replicant-full-mode).

`TRUNCATE`
: If the table exists in the destination database, Replicant preserves destination table schemas, but replaces the destination data with the source data.

### Additional flags and features
- You can provide the `--lazy-init` flag while using `--truncate-existing` or `--replace-existing`. This instructs Replicant to replace the existing data at the last moment. By default, Replicant removes the existing data during Replicant's initialization phase.
- Replicant has another write mode `--synchronize-deletes` that only applies to [delta-snapshot replication](#replicant-delta-snapshot-mode). When you start Replicant in `delta-snapshot` mode with the `--synchronize-deletes` flag, the following events occur:
  - Replicant deletes all rows from a target table that don't exist in the corresponding source table. 
  - Replicant shuts down after finishing the row synchronization. 
  
  You can restart Replicant in `--resume` mode by omitting the `--synchronize-deletes` flag, allowing Replicant to resume the delta-snapshot replication.

## Test connection
Replicant can perform validation checks on the connection configuration file of a database using the `test-connection` CLI option. This option checks the validity of credentials, host, port, and other connection parameters before you run the actual replication. This allows you to confirm that you possess a valid connection configuration file and Replicant can connect to the database.

To use this feature, follow these steps:

### 1. Define the validation configuration
Define the configuration and test cases for the validation checks in a YAML file. You need to provide Replicant the full path to this YAML file with the `--validate` argument.

You can define the following parameters in the validation configuration file:

#### `end-point-type`
Specifies whether you want to perform validation checks on the source or the target database. Test connection feature supports the following `end-point-type`s:

- **`SRC`**. `test-connection` mode performs source-specific validation, such as read access to CDC logs.
- **`DST`**. `test-connection` mode performs target-specific validation. For example, DDL and DML permission on target database.

#### `mode`
Specifies the replication mode. Test connection feature supports the following `mode`s:

- `SNAPSHOT`
- `FULL`
- `REALTIME`

`mode` tells `test-connection` to perform validation for that specific replication mode. For example, if you set `mode` to `SNAPSHOT`, then `test-connection` mode performs the validation checks for snapshot replication. These validation checks might include necessary database permissions, for example, [the global permissions for Oracle source]({{< ref "docs/sources/source-setup/oracle/setup-guide/oracle-traditional-database#iv-set-up-global-permissions" >}}).

#### `validate-read-access-to-systemTables`
`true` or `false`.

Whether to check for necessary access to [database system metadata tables]({{< ref "docs/sources/source-setup/oracle/setup-guide/oracle-traditional-database#table-level-supplemental-logging" >}}).

_Default: `true`._

#### `validate-read-access-to-cdc-logs`
`true` or `false`.

Whether to check for necessary access to CDC logs, for example, Oracle's LogMiner.

{{< hint "warning" >}}
**Important:** This parameter only applies when you set [`end-point-type`](#end-point-type) to `SRC`. Therefore, disable `validate-read-access-to-cdc-logs` if you specify `DST` as the [`end-point-type`](#end-point-type).
{{< /hint >}}

Defaults to `true` if you use `SRC` as the [`end-point-type`](#end-point-type) and use either `FULL` or `REALTIME` as the [`mode`](#mode).

#### `validate-ddl-dml-permission`
`true` or `false`.

Whether to check for necessary access to DDL and DML permissions on target database. For example, `CREATE ANY TABLE` and `INSERT ANY TABLE` for [Oracle target]({{< ref "docs/targets/target-setup/oracle" >}}). 

{{< hint "warning" >}}
**Important:** This parameter only applies when you set [`end-point-type`](#end-point-type) to `DST`. Therefore, disable `validate-ddl-dml-permission` if you specify `SRC` as the [`end-point-type`](#end-point-type).
{{< /hint >}}

_Default: `true` for `DST` as the [`end-point-type`](#end-point-type)._

The following sample shows a sample validation configuration:

```YAML
end-point-type: SRC
mode: FULL

validate-read-access-to-systemTables: true
validate-read-access-to-cdc-logs: true
validate-ddl-dml-permission: false
```

### 2. Run Replicant self-hosted CLI with the necessary options and arguments
The following command validates a MySQL source connection configuration file. The command uses the `--validate` argument and provides full path to the file containing the validation test cases:

```sh
./bin/replicant test-connection conf/conn/mysql.yaml \
--validate conf/validate/validate.yaml
```

The `mysql.yaml` file for example can contain the following configuration:

```YAML
type: MYSQL

host: localhost
port: 3306

username: "replicate"
password: "Replicate#123"

slave-server-ids: [1]
max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000
```

The `validate.yaml` file for example can contain the following validation test cases:

```YAML
end-point-type: SRC
mode: FULL

validate-read-access-to-systemTables: true
validate-read-access-to-cdc-logs: true
validate-ddl-dml-permission: false
```

### 3. Evaluate the report
The `test-connection` mode generates a validation report in JSON format under the `data/replicationID` directory. 

The following sample illustrates how contents of a `test-connection` report looks like:

```json
{
  "hostPortReachable" : "PASSED",
  "credentialCheck" : "PASSED",
  "healthStatus" : "RUNNING",
  "readAccessToSystemTables" : "PASSED",
  "missingPermissions" : { },
  "errorMessages" : { },
  "urlReachable" : "SKIPPED"
}
```
In the preceding sample validation report, the following fields describe different aspects of the  report:

- `hostPortReachable` indicates whether Replicant can reach the host and port.
- `credentialCheck` indicates the validity of the `username` and `password` you specify in the connection configuration file.
- `healthStatus` (available for [Databricks]({{< ref "docs/targets/target-setup/databricks" >}}) only) describes the Databricks cluster state.
- `readAccessToSystemTables` indicates if the `username` of the connection configuration file possesses read access to CDC logs
- `missingPermissions` lists any missing permissions.
- `errorMessages` lists error or exceptions that might occur during validations.

{{< hint "info" >}}
**Note:**
- To carry out replication using superuser, disable the following validation test cases since metadata tables don't always store superuser permissions:  
   - `validate-read-access-to-systemTables`
   - `validate-read-access-to-cdc-logs`
   - `validate-ddl-dml-permission`
- If the source database doesn’t support CDC, then `test-connection` mode internally ignores `validate-read-access-to-cdc-logs`.
{{< /hint >}}
## Additional Replicant commands
* You can stop replication with the CTRL C signal.
* If you stop replication for any reason, you can restart the job exactly where Replicant had stopped by replacing the `--overwrite` argument `by --resume` in the replicant command:
  ```BASH
  ./bin/replicant full conf/conn/source_database_name_src.yaml \
  conf/conn/target_database_name_dst.yaml \
  --extractor conf/src/source_database_name.yaml \
  --applier conf/dst/target_database_name.yaml \
  --filter filter/source_database_name_filter.yaml \
  --id rep11 --replace --resume
  ```

## Various Replication Options Explanation

Replicant has the following four replication options:

  * `overwrite`: This option enables completely overwriting the existing replication with the specified -`-id`. The option makes replicant:
    -	Overwrite the existing replicated tables on target (if any) honoring the specified WriteMode (REPLACE/TRUNCATE/APPEND).
    -	Overwrite the directory with name %id% created under data directory.
    -	Overwrites all internal metadata tables created by replicant on the metadata storage.
  * `resume`: This option enables resuming the existing replication with the specified `--id`. Note that you can either specify the `overwrite` option or the `resume` option, but not both.
  * `terminate-post-snapshot`: With this option, Replicant will start in full mode (existing + realtime data replication) and once the snapshot (transfer of existing data) is complete, Replicant will terminate the job. You can resume the replication later on with the `--resume` option. Upon resumption of the job, Replicant will immediately start realtime replication as previously existing data in the source database will have already been replicated in the data snapshot.
  * `--skip-failed-txn`: Replicant provides an option to skip over failed transactions. This allows you to resolve replication blockage caused by the failing transactions. During realtime replication in full/real-time mode, if a transaction could not be successfully applied to the destination database even after configured number of retries, Replicant dumps the transaction statements into a table in the destination storage. This table is labelled `replicate_io_failed_txn_<group_id>_<replicant_id>`. The table contains the following details about the failed transaction: 

    - Catalog name
    - Schema name
    - Table name 
    - Operation statements (SQLs)
    - Cursors(for internal use)

    As user you can intervene and resolve the failed transaction (manually or using other means) using the details logged in the aforementioned table. After successfully resolving the failed transaction, you need to run the original Replicant command with the extra option `--skip-failed-txn` so that Replicant skips over the failed transaction.

    For example,

    ```sh
    ./bin/replicant full conf/conn/oracle.yaml conf/conn/singlestore.yaml \
    --extractor conf/src/oracle.yaml \
    --applier conf/dst/singlestore.yaml \
    --filter filter/oracle_filter.yaml \
    --map mapper/oracle_to_singlestore.yaml \
    --replace-existing --skip-failed-txn
    ```
    After running the aforementioned command, you can resume Replicant with the `--resume` option:

    ```sh
    ./bin/replicant full conf/conn/oracle.yaml conf/conn/singlestore.yaml \
    --extractor conf/src/oracle.yaml \
    --applier conf/dst/singlestore.yaml \
    --filter filter/oracle_filter.yaml \
    --map mapper/oracle_to_singlestore.yaml \
    --replace-existing --resume
    ```
<!--   * **continue-inconsistent-post-failure**: When this option is specified, replicant logs a failed transaction in a failed_txn table and continues replication without stopping. Note that using this option may introduce inconsistencies in the destination database. -->

## Encrypting Replicant
You can encrypt your configuration files that Replicant uses to perform replication. After you have finished editing a particular configuration file, use the following command to encrypt that configuration file:

```sh
./bin/replicant encrypt-config PATH_TO_CONFIGURATION_FILE
```

Replace *`PATH_TO_CONFIGURATION_FILE`* with the full path to the configuration file you want to encrypt.

To encrypt all the configuration files in a directory, specify the path to that directory:

```sh
./bin/replicant encrypt-config PATH_TO_DIRECTORY
```

Replace *`PATH_TO_DIRECTORY`* with the full path to the directory.

You can't decrypt an encrypted configuration file. This prevents any unwanted attempts of decryption of sensitive information present in the configuration files. If you need to modify a configuration file that you have already encrypted, you must bring the original plain text configuration file from your own backup storage, modify it, and encrypt it again using `encrypt-config` option.
