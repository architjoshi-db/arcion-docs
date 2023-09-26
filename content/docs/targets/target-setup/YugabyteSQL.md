---
pageTitle: Documentation for YugabyteSQL target connector
title: Yugabyte SQL
description: "Ingest data into Yugabyte SQL in minutes with seamless schema conversion using Arcion Yugabyte connector."
url: docs/target-setup/yugabyte_sql
bookHidden: false
---
# Destination YugabyteSQL

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) download as the `$REPLICANT_HOME` directory.

## Prerequisites
### Privilege to create schemas and tables
If you want Replicant to create catalogs or schemas on the target Yugabyte SQL, make sure the user has the privilege to do so. Also make sure that the user being used for replication has the privilege to create tables on the target catalogs or schemas where you want to replicate the tables to.  Use the following commands to grant the privileges:

1. Grant the privilege to create schemas on a database:

    ```SQL
    GRANT CREATE ON DATABASE <database_name> TO <replication_user>;
    ```

2. Grant the privilege to create tables within the schema of a database:

    ```SQL
    GRANT CREATE ON SCHEMA <schema_name> TO <replication_user>
    ```

Replace the following: 
- *`database_name`*: the database name in the target
- *`replication_user`*: the user being used for replication
- *`schema_name`*: the schema name

### Replicant Metadata
In order to store Arcion’s replication metadata, you must ensure one of the following: 
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

Specify our Yugabyte SQL connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `yugabytesql.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

For connecting to Yugabyte SQL, you can choose between two methods for an authenticated connection:
  - [Using username and password without SSL](#connect-using-username-and-password-without-ssl)
  - [Using username and password with SSL](#connect-using-ssl)

### Connect using username and password without SSL
To connect to Yugabyte SQL using username and password without SSL, you have the following two options:

{{< tabs "username-pwd-authentication" >}}
{{< tab "Specify credentials in plain text" >}}

You can specify your credentials in plain text in the connection configuration file like the folowing sample:

```YAML
type: YUGABYTESQL

host: HOSTNAME
port: PORT_NUMBER

database: 'DATABASE_NAME'
username: 'USERNAME'
password: 'PASSWORD'

socket-timeout-s: 60
max-connections: 30
max-retries: 10
retry-wait-duration-ms: 1000
```

Replace the following:

- *`HOSTNAME`*: the hostname of the YugabyteDB cluster.
- *`PORT_NUMBER`*: the port number. Default port is `5433`.
- *`DATABASE_NAME`*: the database name you want to connect to. Default database is `yugabyte`.
- *`USERNAME`*: the username for the user that connects to the `database`. Default username is also `yugabyte`.
- *`PASSWORD`*: the password associated with *`USERNAME`*. Default password is `yugabyte`.

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in YugabyteDB.
- *`max-retries`*: number of times Replicant retries a failed operation.
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads.

For more information on connection credentials in Yugabyte SQL, see [Default user and password](https://docs.yugabyte.com/preview/secure/enable-authentication/ysql/#default-user-and-password).

{{< /tab >}}

{{< tab "Use a secrets management service" >}}
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
{{< /tab >}}
{{< /tabs >}}

### Connect using SSL
To connect to Yugabyte SQL using SSL, follow these steps:

1. Generate server certificates and set up YugabyteDB for encrypted connection by following the instructions in [Create server certificates
](https://docs.yugabyte.com/preview/secure/tls-encryption/server-certificates/).
2. Specify the SSL connection details to Replicant in the connection configuration file in the following format:

    ```YAML
    ssl:
      enable: true
      root-cert: 'PATH_TO_ROOT_CERTIFICATE_FILE'
      hostname-verification: {true|false}
    ```

    Replace *`PATH_TO_ROOT_CERTIFICATE_FILE`* with the location of [the root certificate file](https://docs.yugabyte.com/preview/secure/tls-encryption/server-certificates/#generate-the-root-certificate-file). 
    
    `hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. This defaults to `true`.


## II. Configure mapper file (optional)
If you want to define data mapping from source to your target YugabyteSQL, specify the mapping rules in the mapper file. The following is a sample mapper configuration for a **Oracle-to-YugabyteSQL** pipeline:

```YAML
rules:
  [tpch, public]:
    source:
    - "tpch"
convert-case: DEFAULT
```

For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "../configuration-files/mapper-reference" >}}).

## III. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `yugabytesql.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

You can configure Yugabyte SQL for operating in either [`snapshot` mode](#configure-snapshot-mode) or [`realtime` mode](#configure-realtime-mode).

### Configure `snapshot` mode
For operating in [`snapshot` mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the conifiguration file. For example:

```YAML
snapshot:
  threads: 16

  map-bit-to-boolean: true

  bulk-load:
    enable: true
    type: FILE #FILE or PIPE
    serialize: true

    #For versions 20.09.14.3 and beyond
    native-load-configs: #Specify the user-provided LOAD configuration string which will be appended to the s3 specific LOAD SQL command
```
#### Additional `snapshot` parameters
<dl class="dl-indent">
<dt>

`map-bit-to-boolean`
</dt>
<dd>

`{true|false}`.

Whether to map `bit(1)` and `varbit(1)` data types from source to `boolean` on target.

| Value|Behavior|
| ----------- | ----------- |
| `true` | Map `bit(1)`/`varbit(1)` data types from source to `boolean` on target Yugabyte SQL |
| `false`   | Map `bit(1)`/`varbit(1)` data types from source to `bit(1)`/`varbit(1)` on target Yugabyte SQL|

_Default: `true`._
</dd>
</dl>
      
For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure real-time replication
For operating in [`realtime` mode]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}), specify your configuration under the `realtime` section of the conifiguration file. For example:

```YAML
realtime:
 batch-size-rows: 128
 txn-size-rows: 512
 use-quoted-identifiers: false
 skip-tables-on-failures : false
 replay-replace-as-upsert: false

# Transactional mode config
# realtime:
#   threads: 1
#   batch-size-rows: 1000
#   replay-consistency: GLOBAL
#   txn-group-count: 100
#   _oper-queue-size-rows: 20000
#   skip-upto-cursors: #last failed cursor
```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "../configuration-files/applier-reference#realtime-mode" >}}).
