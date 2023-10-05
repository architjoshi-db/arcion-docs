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
  
## I. Set up connection configuration
To connect to your PostgreSQL target database, you have these two options:

{{< tabs "postgres-connection">}}
{{< tab "Use a connection configuration file" >}}
You can specify your connection details to Replicant with a YAML connection configuration file. You can find a sample connection configuration file `cloudsql_postgresql.yaml` in the `$REPLICANT_HOME/conf/conn` directory. 

```YAML
type: POSTGRESQL

host: HOSTNAME
port: PORT_NUMBER

database: 'DATABASE_NAME' 
username: 'USERNAME'
password: 'PASSWORD'

max-connections: 30
socket-timeout-s: 60
max-retries: 10
retry-wait-duration-ms: 1000
```

Replace the following:

- *`HOSTNAME`*: the hostname of the target PostgreSQL instance
- *`PORT_NUMBER`*: the port number
- *`DATABASE_NAME`*: the database name
- *`USERNAME`*: the username of the user that connects to the PostgreSQL server
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in Cloud SQL instance.
- *`max-retries`*: number of times Replicant retries a failed operation.
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads. This parameter is only supported for Arcion self-hosted CLI versions 22.02.12.16 and newer.

{{< hint "warning" >}}
**Important:** Make sure that [`max_connections` in PostgreSQL](https://www.postgresql.org/docs/current/runtime-config-connection.html#GUC-MAX-CONNECTIONS) exceeds the `max-connections` parameter in the preceding connection configuration file.
{{< /hint >}}
{{< /tab>}}

{{< tab "Use a secrets management service" >}}
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
{{< /tab>}}
{{< /tabs >}}


## II. Configure mapper file (optional)
If you want to define data mapping from source to your target PostgreSQL, specify the mapping rules in the mapper file. The following is a sample mapper configuration for a **MySQL-to-PostgreSQL** pipeline:

```YAML
rules:
  [tpch, public]:
    source:
    - [tpch]
```

For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper configuration]({{< ref "../configuration-files/mapper-reference" >}}).

## III. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `postgresql.yaml` in the `$REPLICANT_HOME/conf/dst` directory. For example:

You can configure PostgreSQL for operating in either [snapshot](#configure-snapshot-mode) or [realtime](#configure-realtime-mode) modes.

### Configure `snapshot` mode
For operating in [snapshot mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the conifiguration file. For example:

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

#### Additional `snapshot` parameters

`map-bit-to-boolean` 
: Tells Replicant whether to map `bit(1)` and `varbit(1)` data types from source to `boolean` on target.


  If `true`, Replicant maps `bit(1)`/`varbit(1)` data types from source to `boolean` on target PostgreSQL. If `false`, Replicant maps `bit(1)`/`varbit(1)` data types from source to `bit(1)`/`varbit(1)` on target PostgreSQL.

  *Default: `false`.*

For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure `realtime` mode
If you want to operate in [real time]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}), use the `realtime` section to specify your configuration. For example:

```YAML
realtime:
  threads: 8
  txn-size-rows: 10000
  batch-size-rows: 1000
  skip-tables-on-failures : false

  use-quoted-identifiers: true
```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "../configuration-files/applier-reference#realtime-mode" >}}).
