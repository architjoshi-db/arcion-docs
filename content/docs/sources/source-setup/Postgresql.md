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

2. Create a user for replication:

    ```SQL
    CREATE USER <username> PASSWORD '<password>';
    ```

3. Grant the following permissions:

    ```SQL
    GRANT USAGE ON SCHEMA "<schema>" TO <username>;
    GRANT SELECT ON ALL TABLES IN SCHEMA "<schema>" TO <username>;
    ALTER ROLE <username> WITH REPLICATION;
    ```

## II. Set up PostgreSQL for Replication

1. Open the PostgreSQL configuration file `postgresql.conf`:

   ```BASH
   vi $PGDATA/postgresql.conf
   ```

2. Change the following parameters:

    ```
    wal_level = logical
    max_replication_slots = 1 #Can be increased if more slots need to be created
    ```

3. To perform log consumption for CDC replication from the PostgreSQL server, you must do either of the following:

    - Use the `test_decoding` plugin that is by default installed in PostgreSQL.
    - Install the logical decoding plugin `wal2json`.

    See the following two sections for instructions on how to set up these plugins.

    ### Instructions for using `wal2json`
    1. Follow the instructions in [the `wal2json` project README](https://github.com/eulerto/wal2json/blob/master/README.md) to Install the `wal2json` plugin.

    2. Create a logical replication slot for the catalog to be replicated with the following SQL:

        ```SQL
        SELECT 'init' FROM pg_create_logical_replication_slot('<replication_slot_name>', 'wal2json');
        ```
    3. Verify the slot has been created:
        ```sql
        SELECT * from pg_replication_slots;
        ```

    ### Instructions for using `test_decoding`

    If you're using the `test_decoding` plugin, you don't need to install anything as it comes pre-installed with PostgreSQL.

    1. Use the following SQL to create a logical replication slot for the `test_decoding` plugin:

        ```SQL
        SELECT 'init' FROM pg_create_logical_replication_slot('<replication_slot_name>', 'test_decoding');
        ```
        
    2. Verify that the slot has been created:

        ```SQL
        SELECT * from pg_replication_slots;
        ```

4. Set the Replicant identity to `FULL` for the tables  part of the replication process that do no have a primary key:

   ```SQL
   ALTER TABLE <table_name> REPLICA IDENTITY FULL;
   ```

## III. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the connection configuration file:
    ```BASH
    vi conf/conn/postgresql.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
    ```YAML
    type: POSTGRESQL

    host: localhost #Replace localhost with your PostgreSQL host name
    port: 5432 #Replace the default port number 5432 if needed

    database: "postgres" #Replace postgres with your database name
    username: "replicant" #Replace replicant with your postgresql username
    password: "Replicant#123" #Replace Replicant#123 with your user's password

    max-connections: 30 #Maximum number of connections replicant can open in postgresql
    socket-timeout-s: 60 #The timeout value for socket read operations. The timeout is in seconds and a value of zero means that it is disabled.
    max-retries: 10 #Number of times any operation on the source system will be re-attempted on failures.
    retry-wait-duration-ms: 1000 #Duration in milliseconds Replicant should wait before performing then next retry of a failed operation.

    #List your replication slots (slots which hold the real-time changes of the source database) as follows
      replication-slots:
        io_replicate: #Replace "io-replicate" with your replication slot name
          - wal2json #plugin used to create replication slot (wal2json | test_decoding)
        io_replicate1: #Replace "io-replicate1" with your replication slot name
          - wal2json

    log-reader-type: {STREAM|SQL}
    ```

    The value of `log-reader-type` defaults to `STREAM`. If you choose `STREAM`, Replicant captures CDC data through `PgReplicationStream`. If you choose `SQL`, PostgreSQL server periodically receives SQL statements for CDC data extraction.
      {{< hint "warning" >}}
  **Important:** 
  - Make sure that the `max_connections` in PostgreSQL exceeds the `max_connections` in the preceding connection configuration file.
  - From versions 23.03.01.12 and later, 23.03.31 and later, `log-reader-type` is deprecated. Avoid specifying this parameter.
    {{< /hint >}}


1. You can also enable SSL for your connection by including the `ssl` field and specifying the necessary parameters as below:
    ```YAML
    ssl:
      ssl-cert: <full_path_to_SSL_certificate_file>
      root-cert: <full_path_to_SSL_root_certificate_file>
      ssl-key: <full_path_to_SSL_key_file>
    ```
    The key file must be in PKCS-12 or in PKCS-8 DER format. A PEM key can be converted to DER format using the following openssl command:

    ```BASH
    openssl pkcs8 -topk8 -inform PEM -in postgresql.key -outform DER -out postgresql.pk8 -v1 PBE-MD5-DES
    ```

{{< hint "info" >}} The `socket-timeout-s` parameter has been introduced in *v22.02.12.16* and isn't available in previous versions.{{< /hint >}}

{{< hint "info" >}} If the `log-reader-type` is set to `STREAM`, the replication connection must be allowed as the <username> that will be used to perform the replication. To enable replication connection, the `pg_hba.conf` file needs to be modified with some of the following entries depending on the usecase:

1. From `$REPLICANT_HOME`, navigate to the pg_hba file:
   ```BASH
   vi $PGDATA/pg_hba.conf
   ```
2. Make the necessary changes as follows:
   ```BASH
   # TYPE  DATABASE        USER                  ADDRESS                 METHOD

   # allow local replication connection to <username> (IPv4 + IPv6)
   local     replication         <username>                                         trust
   host      replication         <username>    127.0.0.1/32                     <auth-method>
   host      replication         <username>    ::1/128                          <auth-method>

   # allow remote replication connection from any client machine  to <username> (IPv4 + IPv6)
   host     replication          <username>    0.0.0.0/0                        <auth-method>
   host     replication          <username>    ::0/0                            <auth-method>
   ```
   {{< /hint >}}

## IV. Setup Filter Configuration

1. From `$REPLICANT_HOME`, navigate to the filter configuration file:
    ```BASH
    vi filter/postgresql_filter.yaml
    ```
2. In accordance to you replication needs, specify the data which is to be replicated. Use the format of the example explained below:

    ```YAML
    allow:
      #In this example, data of object type Table in the catalog postgres and schema public will be replicated
      catalog: "postgres"
      schema: "public"
      types: [TABLE]

      #From catalog postgres and schema public, only the CUSTOMERS, ORDERS, and RETURNS tables will be replicated.
      #Note: Unless specified, all tables in the catalog will be replicated
      allow:
        CUSTOMERS:
        #Within CUSTOMERS, the FB and IG columns will be replicated  
          allow: ["FB, IG"]


        ORDERS:  
          #Within ORDERS, only the product and service columns will be replicated as long as they meet the condition o_orderkey < 5000
          allow: ["product", "service"]
          conditions: "o_orderkey < 5000"



        RETURNS: #All columns in the table PART will be replicated without any predicates
    ```

    The following is a template of the format you must follow:

      ```YAML
      allow:
        catalog: <your_catalog_name>
        schema: <your_schema_name>
        types: <your_object_type>

      #If not collections are specified, all the data tables in the provided catalog and schema will be replicated
      allow:
        <your_table_name>:
          allow: ["your_column_name"]
          condtions: "your_condition"

        <your_table_name>:  
          allow: ["your_column_name"]
          conditions: "your_condition"

        <your_table_name>:    
        ```
For a detailed explanation of configuration parameters in the filter file, read: [Filter Reference]({{< ref "../configuration-files/filter-reference" >}} "Filter Reference")

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

For more information about the configuration parameters for `snapshot` mode, see [Snapshot Mode]({{< ref "../configuration-files/extractor-reference#snapshot-mode" >}}).

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

For more information about the configuration parameters for `realtime` mode, see [Realtime Mode]({{< ref "../configuration-files/extractor-reference#realtime-mode" >}}).

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

For more information about the configuration parameters for `delta-snapshot` mode, see [Delta-snapshot Mode]({{< ref "../configuration-files/extractor-reference#delta-snapshot-mode" >}}).