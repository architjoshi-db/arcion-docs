---
pageTitle: Amazon RDS for PostgreSQL connector by Arcion  
title: PostgreSQL
description: "Get fast data ingestion into Amazon RDS for PostgreSQL using Arcion."
url: docs/source-setup/amazon-rds/postgresql
bookHidden: false
---

# Source Amazon RDS for PostgreSQL
This page describes how to replicate data in real time from [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/), a managed service for PostgreSQL relational database.

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) download as the `$REPLICANT_HOME` directory.

## Prerequisites

### I. Set up parameter group
1. [Create a database parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithDBInstanceParamGroups.html#USER_WorkingWithParamGroups.Creating) if you haven't already specified a parameter group for your database instance.
2. Set the `rds.logical_replication` parameter to `1` and attach `rds.logical_replication` to your database instance. You must reboot your database instance for this change to take effect. After rebooting your database instance, the system automatically sets the `wal_level` parameter to `logical`.

    You can verify the values for `wal_level` and `rds.logical_replication` with the following command from `psql` client:

    ```SQL
    postgres=> SELECT name,setting FROM pg_settings WHERE name IN ('wal_level','rds.logical_replication');
    ```

    The output is similar to the following:

    ```
              name           | setting
    -------------------------+---------
    rds.logical_replication | on
    wal_level               | logical
    (2 rows)
    ```
3. In the parameter group, make sure `max_replication_slots` equals to `1` or greater than the number of replication jobs that you need to run from this RDS for PostgreSQL instance.

### II. Create user
1. Create a user for replication in the source RDS for PostgreSQL database instance. For example, the following creates a user `alex`:
    ```SQL
    postgres=> CREATE ROLE alex LOGIN PASSWORD 'alex12345';
    ```
    For more information about creating users, see [Understanding PostgreSQL roles and permissions](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.PostgreSQL.CommonDBATasks.Roles.html).
2. Grant the necessary permissions:
    ```SQL
    postgres=> GRANT USAGE ON SCHEMA "arcion" TO alex;
    postgres=> GRANT SELECT ON ALL TABLES IN SCHEMA "arcion" TO alex;
    postgres=> ALTER ROLE alex WITH REPLICATION;
    ```

    The preceding commands grant the necessary permissions to user `alex` for the schema `arcion`.

### III. Create logical replication slot
1. Log into the PostgreSQL catalog or database with a privileged account that you want to perform replication with.
2. Create a logical replication slot in this catalog or database using the `wal2json` decoding plugin:
    ```SQL
    SELECT 'init' FROM pg_create_logical_replication_slot('arcion_test', 'wal2json');
    ```

    The preceding command creates a replication slot with the name `arcion_test`. The `wal2json` plugin is [available as an extension in RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-extensions.html).
3. Verify that you've successfully created a replication slot:
    ```SQL
    postgres=> SELECT * from pg_replication_slots;
    ```

## Set up connection configuration
To connect to your RDS for PostgreSQL instance using basic username and password authentication, you have the following two options:

{{< tabs "username-pwd-authentication" >}}
{{< tab "Specify credentials in plain text" >}}

Specify your credentials in a plain text YAML connection configuration file:

```YAML
type: POSTGRESQL

host: HOSTNAME
port: PORT_NUMBER

database: "DATABASE_NAME"
username: "USERNAME"
password: "PASSWORD"

max-connections: 30
socket-timeout-s: 60
max-retries: 10
retry-wait-duration-ms: 1000

replication-slots:
  io_replicate:
    - wal2json

log-reader-type: {STREAM|SQL}
```

Replace the following:

- *`HOSTNAME`*: hostname of the RDS for PostgreSQL instance
- *`PORT_NUMBER`*: port number of the RDS for PostgreSQL host
- *`DATABASE_NAME`*: the database name
- *`USERNAME`*: the username credential to log into your RDS for PostgreSQL instance
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in RDS for PostgreSQL database.
- *`max-retries`*: number of times Replicant retries a failed operation.
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads. This parameter is only available from version 22.02.12.16.


{{< hint "warning" >}}
**Important:** Make sure that the value of `max_connections` in your RDS for PostgreSQL instance exceeds the value of `max-connections` in the preceding connection configuration file. For more information, see [Maximum number of database connections in Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html#RDS_Limits.MaxConnections).
{{< /hint >}}

#### Replication slots
The replication slot hold the real-time changes of the source database. The preceding sample specifies a replication slot in the following format:

```YAML
replication-slots:
  SLOT_NAME:
    - PLUGIN_NAME
```

Replace the following: 
- *`SLOT_NAME`*: the replication slot name
- *`PLUGIN_NAME`*: the plugin you've used to create the replication slot. In this case, it's `wal2json`.

You can only specify a single slot in this format.

#### Log reader type

{{< hint "warning" >}}
**Caution:** From versions 23.03.31 and later, `log-reader-type` is deprecated. Avoid specifying this parameter.
{{< /hint >}}
From versions 23.03.01.12 and later, the value of `log-reader-type` defaults to `STREAM`. If you choose `STREAM`, Replicant captures CDC data through `PgReplicationStream`. If you choose `SQL`, RDS for PostgreSQL server periodically receives SQL statements for CDC data extraction.

{{< /tab >}}

{{< tab "Use a secrets management service" >}}
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
{{< /tab >}}
{{< /tabs >}}

### Enable connection by username for `STREAM` log reader
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

   Replace *`USERNAME`* with the RDS for PostgreSQL database username that you want to authenticate for replication.

## Set up filter configuration (optional)
If you want to filter data from your source RDS for PostgreSQL database, specify the filter rules in the filter file. For more information on how to define the filter rules and run Replicant CLI with the filter file, see [Filter configuration]({{< ref "docs/sources/configuration-files/filter-reference" >}}).

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

## Set up Extractor configuration
To configure replication according to your requirements, specify your configuration in the Extractor configuration file.

You can configure the following replication modes by specifying the parameters under their respective sections in the configuration file:

- `snapshot`
- `realtime`
- `delta-snapshot`
  
See the following sections for more information.

For more information about different Replicant modes, see [Running Replicant]({{< ref "docs/running-replicant" >}}).

### Configure `snapshot` replication
The following is a sample configuration for operating in `snapshot` mode:

```YAML
snapshot:
  threads: 16
  fetch-size-rows: 5_000

  _traceDBTasks: true
  min-job-size-rows: 1_000_000
  max-jobs-per-chunk: 32

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

For more information about the configuration parameters for `snapshot` mode, see [Snapshot Mode]({{< ref "docs/sources/configuration-files/extractor-reference#snapshot-mode" >}}).

### Configure real-time replication
For real-time replication, you must create a heartbeat table in the source RDS for PostgreSQL database.

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

For more information about the configuration parameters for `realtime` mode, see [Realtime Mode]({{< ref "docs/sources/configuration-files/extractor-reference#realtime-mode" >}}).

#### Support for DDL replication
Replicant [supports DDL replication for real-time RDS for PostgreSQL source]({{< ref "docs/sources/ddl-replication#supported-sources" >}}). For more information, [contact us](https://arcion.io/contact).

## Replication without replication-slots
If can't create replication slots in RDS for PostgreSQL using `wal2json`, then you can use a third mode of replication called [delta snapshot]({{< ref "docs/running-replicant#replicant-delta-snapshot-mode" >}}). In delta snapshot, Replicant uses RDS for PostgreSQL's internal column to identify changes.

{{< hint "danger" >}}
**Caution:** We strongly recommend that you specify [a `row-identifier-key`]({{< ref "docs/sources/configuration-files/extractor-reference#row-identifier-key" >}}) in [the `per-table-config`]({{< ref "docs/sources/configuration-files/extractor-reference#per-table-config-2" >}}) section for a table that does not have a primary key or a unique key defined.
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

For more information about the configuration parameters for `delta-snapshot` mode, see [Delta-snapshot Mode]({{< ref "docs/sources/configuration-files/extractor-reference#delta-snapshot-mode" >}}).
