---

pageTitle: Use Native Oracle Log Reader (Beta)
title: "Native Log Reader"
description: "Learn how to configure Arcion Replicant to read from and make use of Oracle redo log files. Learn how to use ASM or the file system directly for logs."
weight: 2
url: docs/source-setup/oracle/native-oracle-log-reader/
---

# Use Native Oracle Log Reader (Beta)
{{< hint "info" >}}**Note:** This feature is currently in beta. {{< /hint >}}

It's possible to configure Replicant so that it can read and make use of Oracle redo log files.

## Modify Oracle Connection Configuration File

You need to set the following two parameters in [the Oracle connection configuration file]({{< relref "setup-guide/oracle-traditional-database#v-set-up-connection-configuration" >}}):

```YAML
log-reader: {REDOLOG|REDOLOG_ARCHIVE_ONLY}
transaction-store-location: PATH_TO_TRANSACTION_STORAGE
```

Set `log-reader` to one of the following two values:

- **`REDOLOG`**. Replicant extracts records from online log files as well as archive log files.
- **`REDOLOG_ARCHIVE_ONLY`**. Replicant extracts records only from archive log files.

Replace *`PATH_TO_TRANSACTION_STORAGE`* with the path to a temporary location on the Arcion server. This temporary location stores information about uncommitted Oracle transactions that we track until they're committed or rolled back.

{{< hint "warning" >}}
**Caution:** If the source database often has a high number of long running uncommitted transactions, you need to increase the storage size to accommodate them.
{{< /hint >}}

## Grant Necessary Permissions

Replicant user must possess the following permissions in order to use the native Oracle log reader.

{{< details title="Click to see the list of permissions" open=false >}}
```SQL
GRANT CREATE SESSION TO <USERNAME>;
GRANT EXECUTE_CATALOG_ROLE TO <USERNAME>;
GRANT SELECT ANY TABLE TO <USERNAME>;
GRANT SELECT ON all_constraints TO <USERNAME>;
GRANT SELECT ON all_cons_columns TO <USERNAME>;
GRANT SELECT ON all_indexes TO <USERNAME>;
GRANT SELECT ON all_ind_expressions TO <USERNAME>;
GRANT SELECT ON all_part_tables TO <USERNAME>;
GRANT SELECT ON all_part_key_columns TO <USERNAME>;
GRANT SELECT ON all_tables TO <USERNAME>;
GRANT SELECT ON all_tab_columns TO <USERNAME>;
GRANT SELECT ON all_views TO <USERNAME>;
GRANT SELECT ON dba_constraints TO <USERNAME>;
GRANT SELECT ON dba_cons_columns TO <USERNAME>;
GRANT SELECT ON dba_indexes TO <USERNAME>;
GRANT SELECT ON dba_ind_columns TO <USERNAME>;
GRANT SELECT ON dba_lobs TO <USERNAME>;
GRANT SELECT ON dba_objects TO <USERNAME>;
GRANT SELECT ON dba_tab_cols TO <USERNAME>;
GRANT SELECT ON gv_$database TO <USERNAME>;
GRANT SELECT ON gv_$instance TO <USERNAME>;
GRANT SELECT ON gv_$transaction TO <USERNAME>;
GRANT SELECT ON v_$archived_log to <USERNAME>;
GRANT SELECT ON v_$database TO <USERNAME>;
GRANT SELECT ON v_$log TO <USERNAME>;
GRANT SELECT ON v_$logfile TO <USERNAME>;
GRANT SELECT ON v_$transportable_platform TO <USERNAME>;
```

Replace *`<USERNAME>`* with your Oracle username.
{{< /details >}}

For [Oracle pluggable database]({{< relref "setup-guide/oracle-pluggable-database" >}}), you must add [`CONTAINER` clause](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/GRANT.html#GUID-20B4E2C0-A7F8-4BC8-A5E8-BE61BDC41AC3__GUID-784B9819-D7E8-4613-9674-A07CAE756DAF) to the preceding `GRANT` statements. 

## Choose How to Access Logs
You can either use Oracle ASM to access the logs, or use the file system directly.

### Oracle ASM

Replicant supports using Oracle Automatic Storage Management (ASM) for logs. To use ASM, follow the steps below:

1. Grant the following permissions to Replicant:

    ```SQL
    GRANT SELECT ON gv_$asm_client TO USERNAME
    ```

2. In [your Oracle connection configuration file]({{< relref "docs/sources/source-setup/oracle/setup-guide/oracle-traditional-database#v-set-up-connection-configuration" >}}), create a new section `asm-connection`.  This section will have the necessary ASM connection configuration. Below is a sample connection configuration file with ASM connection details specified as well:

    ```YAML
    type: ORACLE
    host: localhost
    port: 53545
    service-name: IO
    username: 'REPLICANT_USERNAME'
    password: 'REPLICANT_PASSWORD'

    asm-connection:
      host: oracle-asm
      port: 1521
      service-name: +ASM
      username: 'ASM_USERNAME'
      password: 'ASM_PASSWORD'
      max-connections: 10
    ```

    Replace the following:

    - *`REPLICANT_USERNAME`*: your Replicant username.
    - *`REPLICANT_PASSWORD`*: the password associated with your Replicant username.
    - *`ASM_USERNAME`*: the username to connect to the ASM instance.
    - *`ASM_PASSWORD`*: the password associated with *`ASM_USERNAME`*.

  
### File system

To use the file system directly, Replicant must have access to the redo log files for reading. You can allow this access in one of the following two ways:
- Share the locations of the redo log files directly with Replicant.
- Multiplex the redo log files to an alternative location and make that location accessible to Replicant.

If you decide to multiplex the redo log files, you must specify the paths [in the source connection configuration file]({{< relref "setup-guide#vi-set-up-connection-configuration" >}}) using the `log-path` and `archive-log-path` parameters:

```YAML
log-path: PATH_TO_MULTIPLEXED_ONLINE_REDO_LOG_FILES
archive-log-path: PATH_TO_MULTIPLEXED_ARCHIVE_REDO_LOG_FILES
```

Replace the following:
- *`PATH_TO_MULTIPLEXED_ONLINE_REDO_LOG_FILES`*: path to the location on the disk where the online redo logs are multiplexed
- *`PATH_TO_MULTIPLEXED_ARCHIVE_REDO_LOG_FILES`*: path to the location on the disk where the archived redo logs are multiplexed

If Replicant's path(s) to redo log files is different from the database's path, you must include the path(s) explicitly [in the source connection configuration file]({{< relref "setup-guide#vi-set-up-connection-configuration" >}}) using the `alt-log-path` and `alt-archive-log-path` parameters:

```YAML
alt-log-path: REPLICANT_PATH_TO_ONLINE_REDO_LOG_FILES
alt-archive-log-path: REPLICANT_PATH_TO_ARCHIVE_REDO_LOG_FILES
```

Replace the following:
- *`REPLICANT_PATH_TO_ONLINE_REDO_LOG_FILES`*: path to the online redo logs relative to Replicant
- *`REPLICANT_PATH_TO_ARCHIVE_REDO_LOG_FILES`*: path to the archived redo logs relative to Replicant