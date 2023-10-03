---
pageTitle: PostgreSQL Source Connector Documentation
title: PostgreSQL
description: "Learn how to replicate data from Source PostgreSQL with Arcion PostgreSQL connector. Use Filters to have more control over your priorities."
url: docs/source-setup/postgresql
bookHidden: false
---
# Source PostgreSQL

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory.

## I. Create a user in PostgreSQL

1. Log in to PostgreSQL client:

    ```BASH
    psql -U $POSTGRESQL_ROOT_USER
    ```

2. Create a user for replication in the source PostgreSQL instance. For example, the following creates a user `alex`:

    ```SQL
    postgres=> CREATE USER alex PASSWORD 'alex12345';
    ```

3. Grant the following permissions:

    ```SQL
    postgres=> GRANT USAGE ON SCHEMA "arcion" TO alex;
    postgres=> GRANT SELECT ON ALL TABLES IN SCHEMA "arcion" TO alex;
    postgres=> ALTER ROLE alex WITH REPLICATION;
    ```

    The preceding commands grant the necessary permissions to user `alex` for the schema `arcion`.

## II. Set up PostgreSQL for replication

1. Open the PostgreSQL configuration file `postgresql.conf`:

   ```BASH
   vi $PGDATA/postgresql.conf
   ```

2. Set the following parameters:

    ```toml
    wal_level = logical
    max_replication_slots = 1 #Can be increased if more slots need to be created
    ```

3. To perform log consumption for CDC replication from the PostgreSQL server, you must choose between these logical decoding output plugins:

    - [Use the `test_decoding` plugin](#use-the-test_decoding-plugin). This plugin is by default installed in PostgreSQL.
    - [Use the `wal2json` logical decoding plugin](#use-the-wal2json-plugin).

    See the following two sections for instructions on how to set up these plugins.


4. Set the Replicant identity to `FULL` for the tables  part of the replication process that do no have a primary key:

   ```SQL
   ALTER TABLE <table_name> REPLICA IDENTITY FULL;
   ```

### Use the `test_decoding` plugin

If want to use the `test_decoding` plugin, you don't need to install anything as it comes pre-installed with PostgreSQL.

1. Create a logical replication slot for the `test_decoding` plugin:

    ```SQL
    SELECT 'init' FROM pg_create_logical_replication_slot('arcion_test', 'test_decoding');
    ```

    The preceding command creates a replication slot with the name `arcion_test`.
2. Verify that you've successfully created a replication slot:

    ```SQL
    SELECT * from pg_replication_slots;
    ```

### Use the `wal2json` plugin
1. Follow the instructions in [the `wal2json` project README](https://github.com/eulerto/wal2json/blob/master/README.md) to install the `wal2json` plugin.

2. Create a logical replication slot for the catalog you want to replicate:

    ```SQL
    SELECT 'init' FROM pg_create_logical_replication_slot('arcion_test', 'wal2json');
    ```

    The preceding command creates a replication slot with the name `arcion_test`..
3. Verify that you've successfully created a replication slot:
    ```sql
    SELECT * from pg_replication_slots;
    ```

## III. Set up connection configuration

Specify the connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `postgresql.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
Otherwise, you can put your credentials like usernames and passwords in plain text like the following sample:

```YAML
type: POSTGRESQL

host: localhost
port: 5432

database: "DATABASE_NAME" 
username: "USERNAME"
password: "PASSWORD"

max-connections: 30 
socket-timeout-s: 60
max-retries: 10
retry-wait-duration-ms: 1000

#List your replication slots (slots which hold the real-time changes of the source database) as follows
  replication-slots:
    io_replicate: #Replace "io-replicate" with your replication slot name
      - wal2json #plugin used to create replication slot (wal2json | test_decoding)
    io_replicate1: #Replace "io-replicate1" with your replication slot name
      - wal2json

log-reader-type: {STREAM|SQL}
```

Replace the following:

- *`HOSTNAME`*: the hostname of the PostgreSQL server
- *`PORT_NUMBER`*: the port number of the host
- *`DATABASE_NAME`*: the PostgreSQL database name
- *`USERNAME`*: the PostgreSQL username to log into the server 
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in AlloyDB.
- *`max-retries`*: number of times Replicant retries a failed operation.
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads.

The value of `log-reader-type` defaults to `STREAM`. If you choose `STREAM`, Replicant captures CDC data through `PgReplicationStream`. If you choose `SQL`, PostgreSQL server periodically receives SQL statements for CDC data extraction.

{{< hint "warning" >}}
**Important:** 
- Make sure that the `max_connections` in PostgreSQL exceeds the `max_connections` in the preceding connection configuration file.
- From versions 23.03.01.12 and later, 23.03.31 and later, `log-reader-type` is deprecated. Avoid specifying this parameter.
{{< /hint >}}

### Replication slots
The replication slots hold the real-time changes of the source database. The preceding sample specifies two replicaiton slots in the following format:

```YAML
replication-slots:
  SLOT_NAME:
    - PLUGIN_NAME
```

Replace the following: 
- *`SLOT_NAME`*: the replication slot name
- *`PLUGIN_NAME`*: the plugin you've used to create the replication slot—`wal2json` or `test_decoding`.

You can specify as many slots as you want in this format.

### Log reader type
{{< hint "warning" >}}
**Caution:** From versions 23.03.31 and later, `log-reader-type` is deprecated. Avoid specifying this parameter.
{{< /hint >}}
From versions 23.03.01.12 and later, the value of `log-reader-type` defaults to `STREAM`. If you choose `STREAM`, Replicant captures CDC data through `PgReplicationStream`. If you choose `SQL`, PostgreSQL server periodically receives SQL statements for CDC data extraction. To use `STREAM`, follow the instructions in [Enable connection by username for `STREAM` log reader](#enable-connection-by-username-for-stream-log-reader).

#### Enable connection by username for `STREAM` log reader
If you use `STREAM` as the `log-reader-type`, you must allow an authenticated replication connection as the *`USERNAME`* who performs the replication. To do so, modify the `pg_hba.conf` with the following entries depending on the use case:

1. Locate and open [the `pg_hba.conf` file](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html). You can find the default `pg_hba.conf` file inside the data directory initialized by [initdb](https://www.postgresql.org/docs/current/app-initdb.html).
2. Make the following changes:
   ```CONF
   # TYPE  DATABASE        USER                  ADDRESS                 METHOD

   # allow local replication connection to USERNAME (IPv4 + IPv6)
   local     replication         USERNAME                                         trust
   host      replication         USERNAME    127.0.0.1/32                     <auth-method>
   host      replication         USERNAME    ::1/128                          <auth-method>

   # allow remote replication connection from any client machine  to USERNAME (IPv4 + IPv6)
   host     replication          USERNAME    0.0.0.0/0                        trust
   host     replication          USERNAME    ::0/0                            trust
   ```

   Replace *`USERNAME`* with the PostgreSQL database username that you want to authenticate for replication.


## Set up filter configuration (optional)
If you want to filter data from your source PostgreSQL database, specify the filter rules in the filter file. For more information on how to define the filter rules and run Replicant CLI with the filter file, see [Filter configuration]({{< ref "docs/sources/configuration-files/filter-reference" >}}).

For example:

```YAML
allow:
  catalog: "postgres"
  schema: "public"
  types: [TABLE]

  allow:
    CUSTOMERS:
      allow: ["FB, IG"]

    ORDERS:  
      allow: ["product", "service"]
      conditions: "o_orderkey < 5000"

    RETURNS:
```

The preceding sample consists of the following elements:

- Data of object type `TABLE` in the catalog `postgres` and the schema `public` goes through replication.
- From catalog `postgres`, only the `CUSTOMERS`, `ORDERS`, and `RETURNS` tables go through replication.
- From `CUSTOMERS` table, only the `FB` and `IG` columns go through replication.
- From the `ORDERS` table, only the `product` and `service` columns go through replication as long as those columns meet the condition in `conditions`.
- Since the `RETURNS` table doesn't specify anything, the entire table goes through replication.

Unless you specify, Replicant replicates all tables in the catalog.

The following illustrates the format you must follow:

```YAML
allow:
  catalog: <your_catalog_name>
  types: <your_object_type>


  allow:
    <your_table_name>:
      allow: ["your_column_name"]
      condtions: "your_condition"

    <your_table_name>:  
      allow: ["your_column_name"]
      conditions: "your_condition"

    <your_table_name>:
```

## V. Set up Extractor Configuration
To configure replication according to your requirements, specify your configuration in the Extractor configuration file. You can find a sample Extractor configuration file `postgresql.yaml` in the `$REPLICANT_HOME/conf/src` directory. For a detailed explanation of configuration parameters in the Extractor file, see [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").

You can configure the following replication modes by specifying the parameters under their respective sections in the configuration file:

- `snapshot`
- `realtime`
- `delta-snapshot`
  
See the following sections for more information.

For more information about different Replicant modes, see [Running Replicant]({{< ref "../../running-replicant" >}}).

### Configure `snapshot` replication
The following is a sample configuration for operating in `snapshot` mode:

```YAML
snapshot:
  threads: 16
  fetch-size-rows: 5_000

  _traceDBTasks: true
  min-job-size-rows: 1_000_000
  max-jobs-per-chunk: 32

  fetch-partition-tables: true

  per-table-config:
  - catalog: tpch
    schema: public
    tables:
      lineitem:
        row-identifier-key: [l_orderkey, l_linenumber]
        split-key: l_orderkey
        split-hints:
          row-count-estimate: 15000
          split-key-min-value: 1
          split-key-max-value: 60_00
```

For more information about the configuration parameters for `snapshot` mode, see [Snapshot mode]({{< ref "../configuration-files/extractor-reference#snapshot-mode" >}}).

#### Aditional snapshot parameters

`fetch-partition-tables` _[v23.08.31.1]_

: `{true|false}`.
  
  Whether to fetch partition tables.

  _Default: `false`._

### Configure `realtime` replication
For realtime replication, you must create a heartbeat table in the source PostgreSQL database.

1. Create a heartbeat table in any schema of the database you are going to replicate with the following DDL:

    ```SQL
    CREATE TABLE "<user_database>"."public"."replicate_io_cdc_heartbeat"("timestamp" INT8 NOT NULL, PRIMARY  KEY("timestamp"))
    ```

2. Grant `INSERT`, `UPDATE`, and `DELETE` privileges to the user configured for replication.

3. Specify your configuration under the `realtime` section of the Extractor configuration file. For example:

    ```YAML
    realtime:
      threads: 4 
      fetch-size-rows: 10000
      fetch-duration-per-extractor-slot-s: 3
      _traceDBTasks: true

      heartbeat:
        enable: true
        catalog: "postgres"
        schema: "public"
        table-name: replicate_io_cdc_heartbeat
        column-name: timestamp
    
      start-position:
        start-lsn: 0/3261270
    ```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "../configuration-files/extractor-reference#realtime-mode" >}}).

#### Support for DDL replication
Replicant [supports DDL replication for real-time PostgreSQL source]({{< ref "docs/sources/ddl-replication" >}}). For more information, [contact us](https://arcion.io/contact).

## Replication without replication-slots

If you're unable to create replication slots in PostgreSQL using either `wal2json` or `test_decoding,` then you can use a third mode of replication called [delta-snapshot]({{< ref "docs/running-replicant#replicant-delta-snapshot-mode" >}}). In delta-snapshot, Replicant uses PostgreSQL's internal column to identify changes.

{{< hint "danger" >}}
**Caution:** We strongly recommend that you specify [a `row-identifier-key`]({{< ref "../configuration-files/extractor-reference#row-identifier-key" >}}) in [the `per-table-config`]({{< ref "../configuration-files/extractor-reference#per-table-config-2" >}}) section for a table which does not have a primary key or a unique key defined.
{{< /hint >}}

You can specify your configuration under the `delta-snapshot` section of the Extractor configuration file. For example:

```YAML
delta-snapshot:
  row-identifier-key: [orderkey,suppkey]
  update-key: [partkey]
  replicate-deletes: true|false

  per-table-config:
  - catalog: tpch
    schema: public
    tables:
      lineitem1:
        row-identifier-key: [l_orderkey, l_linenumber]
        split-key: l_orderkey
        replicate-deletes: false
```

For more information about the configuration parameters for `delta-snapshot` mode, see [Delta-snapshot mode]({{< ref "../configuration-files/extractor-reference#delta-snapshot-mode" >}}).