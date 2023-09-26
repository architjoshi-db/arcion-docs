---
pageTitle: Use MariaDB as Target
title: MariaDB
description: "Learn how to securely connect to, ensure database privileges on, and load data into MariaDB using Arcion."
url: docs/target-setup/mariadb
bookHidden: false
---
# Destination MariaDB

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Prerequisites

Pay attention to the following before configuring MariaDB as the Target system:

- Make sure the specified user has `CREATE TABLE` and `CREATE TEMPORARY TABLE` privileges on the catalogs/schemas into which replicated tables should be created.
- If you want Replicant to create catalogs/schemas for you on the target MariaDB system, then you also need to grant `CREATE DATABASE`/`CREATE SCHEMA` privileges to the user.
- If this user does not have `CREATE DATABASE` privilege, then create a database manually with name `io_blitzz` and grant all privileges for it to the user specified here. Replicant uses this database for internal checkpointing and metadata management.  

{{< hint "info" >}}
The database/schema of your choice on a different instance of your choice name can be configured using the metadata config feature. For more information, see [Metadata Configuration]({{< ref "docs/references/metadata-reference" >}}).
{{< /hint >}}


## II. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample MariaDB connection configuration file:
    ```BASH
    vi conf/conn/mariadb_dst.yaml
    ```
2. You can establish connection with Target MariaDB using either SSL or plain username and password.

    ### Connect using username and password
    You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
        
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
    ```YAML
    type: MARIADB

    host: HOSTNAME
    port: PORT_NUMBER
    
    username: "USERNAME"
    password: "PASSWORD" 

    max-connections: 30 #Specify the maximum number of connections replicant can open in MariaDB
    max-retries: 10 #Number of times any operation on the system will be re-attempted on failures.
    retry-wait-duration-ms: 1000 #Duration in milliseconds replicant should wait before performing then next retry of a failed operation
    ```
    Replace the following:
    - *`HOSTNAME`*: the hostname of the Target MariaDB host
    - *`PORT_NUMBER`*: the relevant port number of the MariaDB host
    - *`USERNAME`*: the username credential that connects to the MariaDB host
    - *`PASSWORD`*: the password associated with *`USERNAME`*

    ### Connect using SSL
    If you use SSL for connection, you don't need to provide the `host`, `port`, `username`, and `password` parameters separately like the preceding sample. Rather, specify a single connection URL that connects to the MariaDB server containing the necessary credentials. You can specify this URL with the `url` parameter in the connection configuration file.

    The connection URL has the following syntax:

    ```
    mariadb://HOST:POST/DATABASE_NAME?user=USERNAMEpassword=PASSWORD&useSSL=true&allowPublicKeyRetrieval=true"
    ```

    Replace the following:
    - *`HOST`*: the hostname of the Target MariaDB host
    - *`PORT`*: the relevant port number of the MariaDB host
    - *`DATABASE_NAME`*: the name of the MariaDB database
    - *`USERNAME`*: the username credential that connects to the MariaDB host
    - *`PASSWORD`*: the password associated with *`USERNAME`*

## III. Set up Applier Configuration

1. From `$REPLICANT_HOME`, naviagte to the sample MariaDB applier configuration file:
    ```BASH
    vi conf/dst/mariadb.yaml    
    ```
2. Make the necessary changes as follows:

    ```YAML
    snapshot:
      threads: 32 #Specify the maximum number of threads Replicant should use for writing to the target
      batch-size-rows: 10_000 #Specify the size of a batch
      txn-size-rows: 1_000_000 #Determines the unit of an applier-side job

    #If bulk-load is used, Replicant will use the native bulk-loading capabilities of the target database
    bulk-load:
      enable: true|false #Set to true if you want to enable bulk loading
      type: FILE|PIPE #Specify the type of bulk loading between FILE and PIPE
      serialize: true|false #Set to true if you want the generated files to be applied in serial/parallel fashion

      #For versions 20.09.14.3 and beyond
      native-load-configs: #Specify the user-provided LOAD configuration string which will be appended to the s3 specific LOAD SQL command
    ```
{{< hint "warning" >}}
**Caution:** By default, MariaDB disables local data loading which causes bulk loading to fail. So if you want to use bulk loading, make sure to enable [the `local_infile` system variable](https://mariadb.com/docs/server/ref/mdb/system-variables/local_infile/) in your [MariaDB option file](https://mariadb.com/kb/en/configuring-mariadb-with-option-files/).
{{< /hint >}}

For a detailed explanation of configuration parameters in the applier file, read [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").