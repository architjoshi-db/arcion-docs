---
pageTitle: PostgreSQL Target Connector
title: PostgreSQL
description: "Get fast data ingestion into PostgreSQL with Arcion PostgreSQL connector, with native bulk loading and realtime capabilities."
url: docs/target-setup/postgresql
bookHidden: false
---
# Destination PostgreSQL

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the following steps.

## Required permissions
- Make sure that the user being used for replication, has the `CREATE TABLE` privilege on the target catalogs or schemas where you want to replicate the tables to. Use the following command to grant the privileges:
    ```SQL
    GRANT CREATE ON DATABASE <catalog_name> TO <replication_user>;
    ```
    Replace the following: 
    - *`catalog_name`*: the catalog name in the target
    - *`replication_user`*: the user being used for replication 
- In order to store Arcion’s replication metadata, you must ensure one of the following: 
    - Point to an external metadata database. For more information, see [Metadata configuration]({{< ref "docs/references/metadata-reference" >}}).
    - Grant the `CREATEDB` privilege to the user being used for replication. This allows the user to create the `io` database. The user must also possess the privilege to create tables in the `io` database.   Replicant uses this `io` database to maintain internal checkpoint and metadata.

    The following command assigns the `CREATEDB` privilege to a user `alex`:
    ```SQL
    ALTER USER alex CREATEDB;
    ```
    If the user does not have `CREATEDB` privilege, then follow these two steps:
    1. Create a database manually with the name `io`:
        ```SQL
        CREATE DATABASE io;
        ```
    2. Grant all privileges for the `io` database to that user:
        ```SQL
        GRANT ALL ON DATABASE io TO alex;
        ```
  
## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample PostgreSQL connection configuration file:
    ```BASH
    vi conf/conn/postgresql_dst.yaml
    ```
2. If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager](/../../security/secrets-manager). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: POSTGRESQL

    host: localhost #Replace localhost with your PostgreSQL host
    port: 5432  #Replace the 57565 with the port of your host

    database: 'tpch' #Replace tpch with your database name
    username: 'replicant' #Replace replicant with the username of your user that connects to your PostgreSQL server
    password: 'Replicant#123' #Replace Replicant#123 with your user's password

    max-connections: 30 #Specify the maximum number of connections Replicant can open in PostgreSQL
    socket-timeout-s: 60 #The timeout value for socket read operations. The timeout is in seconds and a value of zero means that it is disabled.
    max-retries: 10 #Number of times any operation on the system will be re-attempted on failures.
    retry-wait-duration-ms: 1000 #Duration in milliseconds replicant should wait before performing then next retry of a 
    ```

    {{< hint "warning" >}}
  **Important:** Make sure that the `max_connections` in PostgreSQL is greater than the `max_connections` in the preceding connection configuration file.
    {{< /hint >}}

    The `socket-timeout-s` parameter is only supported for versions 22.02.12.16 and newer.

## II. Configure mapper file (optional)
If you want to define data mapping from source to your target PostgreSQL, specify the mapping rules in the mapper file. The following is a sample mapper configuration for a **MySQL-to-PostgreSQL** pipeline:

```YAML
rules:
  [tpch, public]:
    source:
    - [tpch]
```

For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "../configuration-files/mapper-reference" >}}).

## III. Set up Applier Configuration

1. From `$REPLICANT_HOME`, naviagte to the sample PostgreSQL Applier configuration file:
    ```BASH
    vi conf/dst/postgresql.yaml    
    ```
2. The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to realtime mode.

    ### Parameters related to snapshot mode
    For snapshot mode, below is a sample configuration:

    ```YAML
    snapshot:
      threads: 16
      batch-size-rows: 5_000
      txn-size-rows: 1_000_000
      skip-tables-on-failures: false

      map-bit-to-boolean: false

      bulk-load:
        enable: true
        type: FILE # FILE or PIPE

      _traceDBTasks: true
      use-quoted-identifiers: true
    ```
    
      - `map-bit-to-boolean`: Tells Replicant whether to map `bit(1)` and `varbit(1)` data types from Source to `boolean` on Target:

        - `true`: map `bit(1)`/`varbit(1)` data types from Source to `boolean` on Target PostgreSQL
        - `false`: map `bit(1)`/`varbit(1)` data types from Source to `bit(1)`/`varbit(1)` on Target PostgreSQL

        *Default: `false`.*

    ### Parameters related to realtime mode
    If you want to operate in realtime mode, you can use the `realtime` section to specify your configuration. For example:

    ```YAML
    realtime:
      threads: 8
      txn-size-rows: 10000
      batch-size-rows: 1000
      skip-tables-on-failures : false

      use-quoted-identifiers: true
    ```
    
For a detailed explanation of configuration parameters in the applier file, see [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").