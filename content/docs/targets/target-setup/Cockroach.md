---
pageTitle: CockroachDB as Target
title: Cockroach
description: "Find out how you can get robust data ingestion into CockroachDB using Arcion. Learn about necessary database permissions, stage configuration, and more."
url: docs/target-setup/cockroach
bookHidden: false
---
# Destination Cockroach

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample Cockroach connection configuration file:
    ```BASH
    vi conf/conn/cockroach.yaml
    ```
2. The configuration file has two parts:

    - Parameters related to target Cockroach server connection.
    - Parameters related to stage configuration.

    ### Parameters related to target Cockroach server connection
    You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: COCKROACH

    host: localhost #Replace localhost with your Cockroach host
    port: 26257 #Replace the 26257 with the port of your host

    username: 'replicant' #Replace replicant with the username of your user that connects to your Cockroach server
    password: 'Replicant#123' #Replace Replicant#123 with your user's password

    max-connections: 30 #Specify the maximum number of connections Replicant can open in Cockroach
    max-retries: #Number of times any operation on the system will be re-attempted on failures.
    retry-wait-duration-ms : #Duration in milliseconds replicant should wait before performing then next retry of a failed operation
    ```
    - Make sure the specified user has `CREATE TABLE` privilege on the catalogs/schemas into which replicated tables should be created.
    - If you want Replicant to create catalogs/schemas for you on the target CockroachDB system, then you also need to grant `CREATE DATABASE`/`CREATE SCHEMA` privileges to the user.
    - If this user does not have `CREATE DATABASE` privilege, then create a database manually with name `io` and grant all privileges for it to the user specified here. Replicant uses this database for internal checkpointing and metadata management.  

        {{< hint "info" >}} The database/schema of your choice on a different instance of your choice name can be configured using the metadata config feature. For more information, see [Metadata Configuration]({{< ref "docs/references/metadata-reference" >}}).{{< /hint >}}

    ### Parameters related to stage configuration
    It is possible to use a local, native, or an external stage like S3 to hold the data files and then load them on the target Cockroach database from there. This section allows you to specify the details Replicant needs to connect to and use a specific stage.

    - `type`: The stage type. Allowed stages are `LOCAL_FS`, `NATIVE`, and `S3`.
      - `LOCAL_FS`: Stage type where users can specify the `external-io-dir` of the Cockroach system.
      - `NATIVE`: stage type where replicant uses `cockroach nodelocal upload` utility to upload the data files for `IMPORT` to load into Cockroach. Users need to specify other details:
        - `conn-url`: URL of the CockroachDB server as required for the [`cockroach nodelocal upload`](https://www.cockroachlabs.com/docs/stable/cockroach-nodelocal-upload.html) command.
        - `user`: User with appropriate privilege to be able to run this command.
      - `S3` : Stage type where Replicant uses the specified S3 account to hold the data files for `IMPORT` to load into Cockroach.

   {{< hint "info" >}}
   For a `NATIVE` stage, you must install Cockroach on the host running Replicant with the following four steps:
   
   1. Get the latest binary: 
       ```shell
       wget -qO- https://binaries.cockroachdb.com/cockroach-v20.1.0-beta.1.linux-amd64.tgz | tar xvz
       ```

   2. Copy the binary into your PATH so it's easy to execute cockroach commands from any shell:
       ```shell
       cp -i cockroach-v20.1.0-beta.1.linux-amd64/cockroach /usr/local/bin/
       ```
   3. If you get a permissions error, prefix the command with `sudo`.

   4. Verify that `cockroach nodelocal upload` is a valid command.
   {{< /hint >}}
   {{< hint "warning" >}} The target CockroachDB version must support the `cockroach nodelocal upload` command for this stage type to work. {{< /hint >}}

## II. Set up Applier Configuration

1. From `$REPLICANT_HOME`, naviagte to the sample Cockroach applier configuration file:
    ```BASH
    vi conf/dst/cockroach.yaml
    ```
2. Make the necessary changes as follows:
    ```YAML
    snapshot:
     threads: 16 #Specify the maximum number of threads Replicant should use for writing to the target

     #If bulk-load is used, Replicant will use the native bulk-loading capabilities of the target database
     bulk-load:
       enable: true|false #Set to true if you want to enable bulk loading
       type: FILE|PIPE #Specify the type of bulk loading between FILE and PIPE
       method: IMPORT # COPY, IMPORT
       max-files-per-bulk-load: 10 #Specify the maximum number of files that can be replicated per bulk-load
       node-id: 1
       serialize: false|true #Serialize must be true for method IMPORT
       serialize-stage-upload: false

    # bulk-load:
    #   enable: true
    #   type: FILE   # PIPE, FILE
    #   method: COPY # COPY, IMPORT
    #   max-files-per-bulk-load: 1
    #   serialize: false
    ```
For a detailed explanation of configuration parameters in the applier file, read [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").