---
pageTitle: Documentation for Oracle Target connector
title: Oracle
description: "Set up Oracle as Target for your data pipelines. Use Oracle's native Data Pump Import utility for homogenous pipelines."
bookHidden: false
url: docs/target-setup/oracle
---
# Destination Oracle

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Obtain the JDBC Driver for Oracle

Replicant requires Oracle JDBC Driver as a dependency. To obtain the appropriate driver, follow the steps below: 

- Go to the [Oracle Database JDBC driver Downloads page](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html).
- We recommend JDBC Driver 18c and Java 8 compatible driver. So navigate to the **Oracle Database 18c Downloads** section. 
- From there, download the [Oracle JDBC Driver `ojdbc8.jar`](https://download.oracle.com/otn-pub/otn_software/jdbc/1815/ojdbc8.jar).
- Put the `ojdbc8.jar` file inside `$REPLICANT_HOME/lib` directory.

## II. Set up Shared Directory

Replicant uses the [external directory feature in Oracle](https://docs.oracle.com/cd/B19306_01/server.102/b14215/et_concepts.htm) for efficient loading of data into target Oracle. You must specify the shared directory [in the `stage` section of the connection configuration file](#iv-set-up-connection-configuration).

1. Create a directory shared between Replicant host and Oracle host with `READ` and `WRITE` access.
2. One way to create the shared directory is using NFS. You can follow NFS recommendation:

From here onwards, we'll consider the directory created in this step to have the following path: `/data/shared_fs`.

## III. Set up Oracle User Permissions
The following step must be executed in an Oracle client.

1. Grant the following privileges to the host replicant user
   ```SQL
    GRANT CREATE TABLE TO <USERNAME>;
    --If you are unable to provide the permission above, you must manually create all the tables

    GRANT CREATE ANY DIRECTORY TO <USERNAME>;
    --If you are unable to provide the permission above, you must manually create the following directories:
    CREATE OR REPLACE DIRECTORY csv_data_dir AS '/data/shared_fs';
    CREATE OR REPLACE DIRECTORY csv_log_dir AS '/data/shared_fs';


    GRANT ALTER TABLE TO <USERNAME>;
    --
    ```
2. Manually create user schema and a schema named io_replicate. Grant both of them permission to access a tablespace

## IV. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:
    ```BASH
    vi conf/conn/oracle_dst.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
      ```YAML
      type: ORACLE

      host: localhost #Replace localhost with your oracle host name
      port: 1521 #Replace the default port number 1521 if needed
      service-name: IO #Replace IO with the service name that contains the schema you will be replicated

      username: 'REPLICANT' #Replace REPLICANT with your username of the user that connects to your oracle server
      password: 'Replicant#123' #Replace Replicant#123 with the your user's password

      stage:
        type: SHARED_FS
        root-dir: /data/shared_fs  #Enter the path of the shared directory

      max-connections: 30 #Maximum number of connections replicant can open in Oracle
      max-retries: 10 #Number of times any operation on the system will be re-attempted on failures.
      retry-wait-duration-ms: 1000 #Duration in milliseconds replicant should wait before performing then next retry of a failed operation

      #charset: AL32UTF8 #Character set to use when transferring data. This option must match the charset value in the source connection configuration.

    ```
    - Make sure the specified user has the following privileges on the catalogs/schemas into which replicated tables should be created:
      - `CREATE TABLE`
      - `CREATE SCHEMA`
      - `CREATE ANY DIRECTORY`
      - `ALTER TABLE`
    - If the user does not have `CREATE SCHEMA` privilege, then create a schema manually with name `io_blitzz` and grant all privileges for it to the user specified here. Replicant uses this database for internal checkpointing and metadata management.

    ### Additional parameters
    * `max-metadata-connections`*[v21.05.04.6]*: When `--metadata` switch is not provided, the target is used as a metadata store. This config will determine the connection pool size for metadata storage.

## V. Set up Applier Configuration

Replicant supports creating/loading tables at the partition and subpartition levels. Follow the instructions below if you want to change the behavior.

1. From `$REPLICANT_HOME`, naviagte to the sample applier configuration file:
   ```BASH
   vi conf/dst/oracle.yaml
   ```

2. The following Oracle-specific parameters are available for `snapshot` mode:
  - `enable-partition-load`: This option enables partition-wise load on target oracle. *It is enabled by default for Oracle->Oracle pipeline.* 
  - `disable-partition-wise-load-on-failure`: If there is a mismatch between the partitioning spec on source and target, Replicant will throw error at runtime. If this option is set to `true`, Replicant will automatically fall back to non-partition aware multi-threaded load in next retry attempt.
  - `init-constraint-post-snapshot`: This config creates constraints and indexes after the snapshot is complete.
  - `init-views-as-views`*[v21.04.06.8]*: To create views as views instead of as tables. 
  
    *Default: By default, this parameter is set to `false`.*

  - `init-views-post-snapshot`*[v21.04.06.8]*: If init-views-as-views is true, this option will create views after snapshot is complete. If disabled, views are created prior to snapshot. (by default this is true).
  - `bulk-load`: Arcion can leverage underlying support of `FILE` based bulk loading into the target system. The following parameters are available for bulk loading:
    - `enable`: `true` or `false`. Whether to enable or disable bulk loading.
    - `type`: `FILE`
    - `serialize`: Specifies whether the files generated should be applied in serial/parallel fashion. Values are either `true` or `false`. 
    - `method`: Specifies the method of bulk loading. The following methods are available:
      - `EXTERNAL_TABLE`: This method uses an external table to load intermediate CSV files that Replicant generates into the target Oracle. The prerequisite for this mechanism is that we need to have a shared directory between Replicant machine and target Oracle.
      - `SQLLDR`: Uses [Oracle's `sqlldr` utility](https://docs.oracle.com/cd/B19306_01/server.102/b14215/part_ldr.htm) for client side data loading into target Oracle. `SQLLDR` does not require shared directory between Replicant machine and target Oracle. However, you need to set the following three environment variables before executing the Replicant process. You can include them in `.bashrc` as well.

        ```bash
        export ORACLE_HOME=<path_to_directory_containing_sqlldr_binary>
        export LD_LIBRARY_PATH="$ORACLE_HOME":$LD_LIBRARY_PATH
        export PATH="$ORACLE_HOME:$PATH"
        ```

        {{< hint "warning" >}}`sqlldr` does not accept case-sensitive usernames. For example, `sqlldr` will not accept the first command below:
        
  ```SQL
  create user “test” identified by “Test#123”
  create user test identified by “Test#123”
  ```
        {{< /hint >}}
      - `NONE`: Instructs Replicant to not use a bulk loader.
  
    - `native-load`: With this parameter set, Replicant uses the Oracle Data Pump Import (`impdp`) utility to load table data instead of JDBC. This enables Replicant to efficiently handle large-scale data. For more information, see [Oracle Native Import](#oracle-native-import). 
    
      The following configuration parameters are available under `native-load`:
        - `enable`: `true` or `false`. Whether to enable `native-load`.
        - `stage-type`: The type of staging area. Allowed values are `SHARED_FS` and `ASM`. The staging area can either be a shared directory or Oracle ASM.
        - `directory`: The Oracle directory object corresponding to the `stage-type`. For more information, see [Create directory object in Source and Target Oracle](#create-directory-object-in-source-and-target-oracle).
        - `path`: Full path to the NFS (Network File System) representing the directory shared between Replicant and Oracle.

  Below is a sample config:

   ```YAML
   snapshot:
     enable-partition-load: true
     disable-partition-wise-load-on-failure: false

     bulk-load : Arcion can leverage underlying support of FILEbased bulk loading into the target system.
       enable: true
       type: FILE
       serialize: true/false.
       method: SQL_LOADER.
    
    # native-load config is only available for Oracle -> Oracle replication
    #  native-load:
    #    enable: false
    #    stage-type: SHARED_FS
    #    directory: SHARED_STAGE
    #    shared-path: path-to-nfs


   ```
   For a detailed explanation of configuration parameters in the applier file, read [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").

## Oracle Native Import

For Oracle as both Source and Target systems, Replicant uses Oracle's native Data Pump Import (`impdp`) utility to load data into the Target. To set up Replicant and Target Oracle to use this feature, follow the instructions below:

### Set up `impdp` in Replicant host machine
- Download the [Oracle Instant Client Tools Package ZIP](https://download.oracle.com/otn_software/linux/instantclient/216000/instantclient-tools-linux.x64-21.6.0.0.0dbru.zip) and extract the files.
- Copy the `impdp` file to the `/usr/bin` directory.
- Download the [Oracle Instant Client Basic Package ZIP](https://download.oracle.com/otn_software/linux/instantclient/216000/instantclient-basic-linux.x64-21.6.0.0.0dbru.zip) and extract the files in a directory.
- Copy the path to the directory where you extracted the ZIP archive.
- Set the `ORACLE_HOME` and `LD_LIBRARY_PATH` environment variables in your `~/.bashrc` file:
  ```BASH
  export ORACLE_HOME=instantClientBasicPath
  export LD_LIBRARY_PATH="$ORACLE_HOME":$LD_LIBRARY_PATH
  export PATH="$ORACLE_HOME:$PATH"
  ```
### Create directory object in Source and Target Oracle
Replicant uses the [external directory feature of Oracle](https://docs.oracle.com/cd/B19306_01/server.102/b14215/et_concepts.htm) for efficient loading of data into Target Oracle. So you need to create a directory shared between Replicant host and Oracle host (both Source and Target) with `READ` and `WRITE` access. To do so, follow the steps below:

- Launch Oracle SQL Plus from the terminal.
- From the SQL Plus prompt, execute the following SQL commands:
  ```SQL
  create directory SHARED_STAGE as '/shared-volume';
  grant read,write on directory SHARED_STAGE to SYSTEM;
  ```

### Modify the Replicant Applier configuration file
In Replicant's Applier configuration file of Target Oracle, add a new `native-load` section under `snapshot`. This section holds the necessary parameters for Replicant to start using Oracle's native Import utility. For more information, see [Set up Applier Configuration](#v-set-up-applier-configuration).