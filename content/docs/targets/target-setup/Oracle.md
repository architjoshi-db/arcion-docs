---
pageTitle: Documentation for Oracle Target connector
title: Oracle
description: "Set up Oracle as Target for your data pipelines. Use Oracle's native Data Pump Import utility for homogenous pipelines."
bookHidden: false
url: docs/target-setup/oracle
---
# Destination Oracle
The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## I. Obtain the JDBC driver for Oracle

Replicant requires Oracle JDBC Driver as a dependency. To obtain the appropriate driver, follow these steps: 

- Go to the [Oracle Database JDBC driver Downloads page](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html).
- We recommend JDBC Driver 18c and Java 8 compatible driver. So navigate to the **Oracle Database 18c Downloads** section. 
- From there, download the [`ojdbc8.jar` file](https://download.oracle.com/otn-pub/otn_software/jdbc/1815/ojdbc8.jar).
- Put the `ojdbc8.jar` file inside `$REPLICANT_HOME/lib` directory.

## II. Set up shared directory

Replicant uses the [external directory feature in Oracle](https://docs.oracle.com/cd/B19306_01/server.102/b14215/et_concepts.htm) for efficient loading of data into target Oracle. You must specify the shared directory [in the `stage` section of the connection configuration file](#iv-set-up-connection-configuration).

1. Create a directory shared between Replicant host and Oracle host with `READ` and `WRITE` access.
2. You can use network file system (NFS) to create the shared directory. For more information, see [About NFS](https://docs.oracle.com/en/operating-systems/oracle-linux/7/fsadmin/fsadmin-SharedFileSystemAdministration.html#ol7-about-nfs) and [Configuring an NFS server](https://docs.oracle.com/en/operating-systems/oracle-linux/7/fsadmin/fsadmin-SharedFileSystemAdministration.html#ol7-cfgsvr-nfs).

The following steps use `/data/shared_fs` as the shared directory.

## III. Set up Oracle user permissions
Follow these steps in an Oracle client to grant the [necessary privileges](https://docs.oracle.com/en/database/oracle/oracle-database/18/sqlrf/GRANT.html#GUID-20B4E2C0-A7F8-4BC8-A5E8-BE61BDC41AC3) to your Oracle user. The following steps provide these privileges to user `alex`:

1. Grant the `CREATE TABLE` privilege:
    ```SQL
    GRANT CREATE TABLE TO alex;
    ```
    If you can't provide this permission, you must manually create all the tables.
2. Grant the `CREATE ANY DIRECTORY` privilege:
    ```SQL
    GRANT CREATE ANY DIRECTORY TO alex;
    ```
    
    If you can't provide this permission, you must manually create the following directories using [`CREATE OR REPLACE`](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-DIRECTORY.html#GUID-8E9C569A-1B06-42C4-9586-0EF83437001A):

    ```SQL
    CREATE OR REPLACE DIRECTORY csv_data_dir AS '/data/shared_fs';
    CREATE OR REPLACE DIRECTORY csv_log_dir AS '/data/shared_fs';
    ```
3. Grant the `ALTER TABLE` privilege:
    ```SQL
    GRANT ALTER TABLE TO alex;
    ```
4. Manually create user schema and a schema `io_replicate`. Grant both of these schemas permission to access a [tablespace](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/glossary.html#GUID-AA66891C-71B2-4D55-8F64-0E427AE24E88).

You must make sure that the user you specify in the [connection details](#iv-set-up-connection-configuration) has the preceding privileges:

- `CREATE ANY DIRECTORY`
- `CREATE SCHEMA`
- `CREATE TABLE`
- `ALTER TABLE`

If the user does not have `CREATE SCHEMA` privilege, then follow these steps:
1. Create a schema manually with name `io_blitzz`.
2. Grant all privileges for the `io_blitzz` schema to that user. 

Replicant uses `io_blitzz` to maintain internal checkpoints and metadata.

## IV. Set up connection configuration
Specify our Oracle connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `oracle_dst.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
Otherwise, put your credentials in plain text YAML file like the following sample:

```YAML
type: ORACLE

host: HOSTNAME
port: PORT_NUMBER
service-name: SERVICE_NAME

username: 'USERNAME'
password: 'PASSWORD'

stage:
  type: SHARED_FS
  root-dir: /data/shared_fs  #Enter the path of the shared directory

max-connections: 30
max-retries: 10
retry-wait-duration-ms: 1000

charset: AL32UTF8
```

Replace the following:

- *`HOSTNAME`*: the Oracle server hostname
- *`PORT_NUMBER`*: the port number of Oracle host (defaults to `1521`)
- *`SERVICE_NAME`*: the [database service name](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/SERVICE_NAMES.html#GUID-AC956707-D568-4F8A-BF2E-99BA41E0A64F) that contains the schema you want to replicate
- *`USERNAME`*: the username to connect to Oracle
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in Oracle.
- *`max-retries`*: number of times Replicant retries a failed operation.
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.

### Additional parameters
`max-metadata-connections`*[v21.05.04.6]*
: When you don't specify [the `--metadata` flag]({{< ref "docs/references/metadata-reference" >}}), Replicant uses the target to store metadata. This parameter determines the connection pool size for metadata storage.

`charset`
: The [Unicode character set to use](https://docs.oracle.com/en/database/oracle/oracle-database/19/nlspg/supporting-multilingual-databases-with-unicode.html#GUID-CD422E4F-C5C6-4E22-B95F-CA9CABBCB543) when transferring data. The character set you specify here must match the character set in the source connection configuration.
  
  Supported value `AL32UTF8`.

## V. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `oracle.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

### Configure `snapshot` mode replication
For operating in [snapshot mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the conifiguration file. For example:

```YAML
snapshot:
  enable-partition-load: true
  disable-partition-wise-load-on-failure: false

  bulk-load:
    enable: true
    type: FILE
    serialize: true
    method: SQLLDR
 
  native-load:
    enable: false
    stage-type: SHARED_FS
    directory: SHARED_STAGE
    shared-path: myhost.sub000445.myvcn.oraclevcn.com:/results
```

For more information about the general Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "../configuration-files/applier-reference#snapshot-mode" >}}).

The following parameters apply to Oracle for `snapshot` mode replication:

`snapshot.enable-partition-load`

: `{true|false}`.

    Enables partition-wise load on target oracle. 
    
    _Default: `true` for Oracle-to-Oracle pipeline._

`snapshot.disable-partition-wise-load-on-failure`

: `{true|false}`.

    If a mismatch occurs between the partitioning spec on source and target, Replicant throws error at runtime. If you set this parameter to `true`, Replicant automatically falls back to multithreaded load without partition awareness in the next retry attempt.

`snapshot.init-constraint-post-snapshot`

: `{true|false}`.

    Creates constraints and indexes after the snapshot completes.

`snapshot.init-views-as-views` *[v21.04.06.8]*
: `{true|false}`.
    
    To create views as views instead of as tables. 
  
    *Default: `false`.*

`snapshot.init-views-post-snapshot` *[v21.04.06.8]*

: `{true|false}`.

    If `snapshot.init-views-as-views` is `true`, setting this parameter to `true` creates views after snapshot completes. If this parameter is `false`, Replicant creates views before snapshot.
    
    _Default: `true`._

`snapshot.bulk-load`
: Arcion can leverage underlying support of `FILE`-based bulk loading into the target system. To configure bulk loading, configure the following parameters under `snapshot.bulk-load`

`snapshot.bulk-load.enable`

: `{true|false}`. 

    Enable or disable bulk loading.

`snapshot.bulk-load.type`
: The type of bulk loading. Only `FILE` type is supported.

`snapshot.bulk-load.serialize`

: `{true|false}`. 
    
    Specifies whether Replicant applies the generated files applied in serial or parallel fashion. 

`snapshot.bulk-load.method`
: Specifies the method of bulk loading. The following methods are supported:

  `NONE`
  : Instructs Replicant to not use a bulk loader.
  
  `EXTERNAL_TABLE`
  : This method uses an external table to load intermediate CSV files that Replicant generates into the target Oracle. For this method to work, Replicant requires a [shared directory between Replicant host machine and target Oracle](#ii-set-up-shared-directory).
  
  `SQLLDR`
  : Uses [Oracle's `sqlldr` utility](https://docs.oracle.com/cd/B19306_01/server.102/b14215/part_ldr.htm) for client side data loading into target Oracle. `SQLLDR` doesn't require shared directory between Replicant host machine and target Oracle. However, you need to set the following three environment variables before starting Replicant. You can include them in `.bashrc` file as well.

    ```bash
    export ORACLE_HOME=PATH_TO_DIRECTORY_CONTAINING_SQLLDR_BINARY
    export LD_LIBRARY_PATH="$ORACLE_HOME":$LD_LIBRARY_PATH
    export PATH="$ORACLE_HOME:$PATH"
    ```

    Replace *`PATH_TO_DIRECTORY_CONTAINING_SQLLDR_BINARY`* with the location of the `sqlldr` binary file.

    {{< hint "warning" >}}**Caution:** `sqlldr` doesn't accept case-sensitive usernames. For example, `sqlldr` doesn't accept the first command:
        
  ```SQL
  create user “test” identified by “Test#123”
  create user test identified by “Test#123”
  ```
    {{< /hint >}}
      
`snapshot.native-load`
: Defines the usage of Oracle Data Pump Import (`impdp`) utility to load table data instead of JDBC. This allows Replicant to efficiently handle large-scale data. For more information, see [Oracle Native Import](#oracle-native-import).

  Native loading is only supported for Oracle-to-Oracle pipeline.

`snapshot.native-load.enable`

: `{true|false}`. 

    Enables or disables native loading.

`snapshot.native-load.stage-type`
: The type of staging area. The following staging areas are supported: 
  
  `SHARED_FS`
  : A shared directory.

  `ASM` 
  : Oracle Automatic Storage Management (ASM).

`snapshot.native-load.directory`
: The Oracle directory object corresponding to the `stage-type`. For more information, see [Create directory object in source and target Oracle](#create-directory-object-in-source-and-target-oracle).

`snapshot.native-load.shared-path`
: Full path to the network file system (NFS) representing the shared directory between Replicant and Oracle.

## Oracle Native Import

For Oracle as both source and target system, Replicant uses Oracle's native Data Pump Import (`impdp`) utility to load data into the target. To set up Replicant and target Oracle to use this feature, follow these instructions:

### Step 1: Set up `impdp` in Replicant host machine
1. Download the [Oracle Instant Client Tools Package ZIP](https://download.oracle.com/otn_software/linux/instantclient/216000/instantclient-tools-linux.x64-21.6.0.0.0dbru.zip) and extract the files.
2. Copy the `impdp` file to the `/usr/bin` directory.
3. Download the [Oracle Instant Client Basic package ZIP](https://download.oracle.com/otn_software/linux/instantclient/216000/instantclient-basic-linux.x64-21.6.0.0.0dbru.zip) and extract the files in a directory.
4. Copy the path to the directory where you've extracted the Instant Client Basic package ZIP archive.
5. Set the `ORACLE_HOME` and `LD_LIBRARY_PATH` environment variables in your `~/.bashrc` file:
    ```BASH
    export ORACLE_HOME=instantClientBasicPath
    export LD_LIBRARY_PATH="$ORACLE_HOME":$LD_LIBRARY_PATH
    export PATH="$ORACLE_HOME:$PATH"
    ```
### Step 2: Create directory object in source and target Oracle
Replicant uses the [external directory feature of Oracle](https://docs.oracle.com/cd/B19306_01/server.102/b14215/et_concepts.htm) for efficient loading of data into Target Oracle. To use this feature, create a directory shared between Replicant host and Oracle host with `READ` and `WRITE` access. You must create this directory in both source Oracle host and target Oracle host.

1. Launch Oracle SQL Plus from the terminal.
2. From the SQL Plus prompt, [create a directory object](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-DIRECTORY.html#GUID-8E9C569A-1B06-42C4-9586-0EF83437001A) that points to an operating system directory. The following creates the `SHARED_STAGE` directory object that points to the `/shared-volume` operating system directory:
    ```SQL
    create directory SHARED_STAGE as '/shared-volume';
    ```
3. [Grant](https://docs.oracle.com/en/database/oracle/oracle-database/18/sqlrf/GRANT.html#GUID-20B4E2C0-A7F8-4BC8-A5E8-BE61BDC41AC3) `READ` and `WRITE` privileges to the directory object: 
    ```SQL
    grant read,write on directory SHARED_STAGE to SYSTEM;
    ```

### Step 3: Modify the Applier configuration file
In Replicant's [Applier configuration file of target Oracle](#v-set-up-applier-configuration), specify the `snapshot.native-load` parameter. This parameter defines the necessary parameters for Replicant to start using Oracle's `impdp` utility.