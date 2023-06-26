---
pageTitle: Documentation for Db2 LUW Source with db2ReadLog API
title: Native LUW
description: "Arcion supports IBM's Db2 for LUW as Source. Learn the setup fundamentals and how to use db2ReadLog API for log management."
url: docs/source-setup/db2/db2_native_luw
bookHidden: false
---

# Source IBM Db2 with Native LUW

You may want to use the [db2ReadLog API](https://www.ibm.com/docs/en/db2/11.1?topic=apis-db2readlog-read-log-records) to read log records from the Db2 database logs, or query the Log Manager for current log state information. This page describes how to use the db2ReadLog API in Arcion when using Db2 as source.

## I. Check permissions
The user must possess the following permissions:

1. Read access on all the databases, schemas, and tables that the user wants to replicate.
2. Read access to following system tables and views:

    a. `SYSIBM.SYSTABLES`

    b. `SYSIBM.SQLTABLETYPES`

    c. `SYSIBM.SYSCOLUMNS`

    d. `SYSIBM.SYSTABCONST`

    e. `SYSIBM.SQLCOLUMNS`
    
    f. `SYSCAT.COLUMNS` (required for [`fetch-schemas`]({{< ref "docs/running-replicant#fetch-schemas" >}}) mode).
3. Execute permissions on the following system procedures:

    a. `SYSIBM.SQLTABLES`

    b. `SYSIBM.SQLCOLUMNS`

    c. `SYSIBM.SQLPRIMARYKEYS`

    d. `SYSIBM.SQLSTATISTICS`

{{< hint "info" >}}
Users need these permissions only once at the start of a fresh replication.
{{< /hint >}}

## II. Create the heartbeat table

For CDC replication, you must create the heartbeat table on the source database with the following DDL:

```SQL
CREATE TABLE "tpch"."replicate_io_cdc_heartbeat"("timestamp" BIGINT NOT NULL, 
CONSTRAINT "cdc_heartbeat_id_default_default" PRIMARY KEY("timestamp"))
```

## III. Enable CDC-based Rreplication

If you want CDC-based replication from the source Db2 server, follow these steps:

### On system running source Db2 server:

1. For each table that you want to replicate, run the following command:

    ```SQL
    ALTER TABLE <TABLE> DATA CAPTURE CHANGES
    ```

2. Check if the database is recoverable by running the following command:

    ```shell
    db2 get db cfg for <DATABASE> show detail | grep -i "logarch"
    ```
    If either `LOGARCHMETH1` or `LOGARCHMETH2` is set, the database is already recoverable.

    {{< hint "info" >}}Skip the next step if the database is already recoverable.{{< /hint >}}

3. Update the Db2 logging method by running the following command:

    ```shell
    db2 update db cfg for <DATABASE> using LOGARCHMETH1 LOGRETAIN
    ```
    The database enters a _backup pending_ state after updating the logging method. To recover from this state, you need to backup the database with the following:
    ```shell
    db2 backup db <DATABASE> to <DESTINATION>
    ```
    Make sure to restart the database using [`db2stop`](https://www.ibm.com/docs/en/db2/11.5?topic=commands-db2stop-stop-db2) and [`db2start`](https://www.ibm.com/docs/en/db2/11.5?topic=commands-db2start-start-db2) commands respectively before running the `backup` command.
     
### On system running Arcion Replicant

{{< hint "info" >}}Skip steps 2-6 if Replicant runs from the same system as the source Db2 database.{{< /hint >}}

1. Configure the `JAVA_OPTS` environment variable with:
    ```shell
    export JAVA_OPTS=-Djava.library.path=lib
    ```

2. Install Db2 Data Server Client prerequisites by running the following commands:

    ```shell
    sudo dpkg --add-architecture i386
    sudo apt install libaio1 libstdc++6:i386 libpam0g:i386
    sudo apt install binutils
    ```
3. You can install Db2 Data server Client as a root user or a non-root user. Non-root installations come with certain limitations. For more information, see [Installing DB2 database servers as a non-root user](https://www.ibm.com/docs/en/dscp/10.1.0?topic=SSSNY3_10.1.0/com.ibm.db2.luw.qb.server.doc/doc/t0050571.htm) 
    
    Follow these steps to install Db2 Data Server Client:

    <ol type="a">
    <li>

    Download latest version of [Db2 Data Server Client from IBM](https://www.ibm.com/support/pages/download-initial-version-115-clients-and-drivers).</li>

    <li>

    Extract and start the installer by running `db2setup`.</li>

    <li>

    Select **Custom** installation in the **Configuration** window.</li>

    <li>
    
    Select the **Base application development tools** checkbox in the **Select Features** window.</li>
    
    <li>

    In the **Instance Owner** window, specify user information for the Db2 instance owner. You can either create a new user, or use an existing user. In both cases, note down the user configuration and make sure to run Replicant as the same user.</li>
    
    <li>

    Leave the remaining installation options as default and complete the installation.</li>
    </ol>

4. Catalog the source Db2 Server node by running the following:

    ```shell
    db2 catalog tcpip node <NODE_NAME> remote <REMOTE> server <PORT>
    ```

5. Catalog the source Db2 database:

    ```shell
    db2 catalog database <DATABASE> at node <NODE_NAME>
    ```

6. Finally, test the connection with:

    ```shell
    db2 connect to <DATABASE> user <USER>
    ```

## IV. Configure Replicant connection
1. Specify your Db2 connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `db2_src.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

    The following shows a sample configuration: 

    ```yaml
    type: DB2

    database: tpch
    host: localhost
    port: 50002

    node: db2inst1

    username: replicant
    password: "Replicant#123"

    max-connections: 30

    max-retries: 10
    retry-wait-duration-ms: 1000
    ```

    Notice the `node` property. It represents the name of the Db2 node you are connecting to. It can go anywhere in the root of the file. The default node name is the Db2 user’s name.

2. Set the value of `cdc-log-storage` to `READ_LOG` in the connection configuration file. This instructs Replicant to use the native db2ReadLog as the CDC log reader:

    ```yaml
    cdc-log-config:
        cdc-log-storage: READ_LOG
    ```

## V. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the sample Extractor configuration file:
   ```BASH
   vi conf/src/db2.yaml
   ```

2. The Extractor configuration file contains three parts:

    - Parameters related to snapshot mode.
    - Parameters related to delta snapshot mode.
    - Parameters related to realtime mode.


    To know about different Replicant modes, see [Running Replicant]({{< ref "docs/running-replicant" >}}).

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
    For realtime mode, you can make use of the following sample:
    
    ```YAML
    realtime:
      #threads: 1
      #fetch-size-rows: 10000
      _traceDBTasks: true
      #fetch-interval-s: 0
      replicate-empty-string-as-null: true

    # idempotent-replay: false

      heartbeat:
        enable: true
        catalog: tpch
        schema: db2user
        #table-name: replicate_io_cdc_heartbeat
        #column-name: timestamp
        interval-ms: 10000
    ```

    #### Support for DDL replication
    Replicant [supports DDL replication for real-time Db2 LUW source]({{< ref "docs/sources/ddl-replication" >}}). For more information, [contact us](https://arcion.io/contact).
    
For a detailed explanation of configuration parameters in the Extractor file, see [Extractor Reference]({{< ref "docs/sources/configuration-files/extractor-reference" >}} "Extractor Reference").