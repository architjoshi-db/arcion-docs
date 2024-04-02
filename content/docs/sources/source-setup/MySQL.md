---
pageTitle: MySQL Source Connector Documentation
title: MySQL
description: "Follow the step-by-step guide to migrate data from MySQL. Replicate generated columns and use Source Column Transformation."
url: docs/source-setup/mysql
bookHidden: false
---
# Source MySQL

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## Prerequisites

### I. Install `mysqlbinlog` utility on Replicant host

Install an appropriate version of the  `mysqlbinlog` utility on the machine where Replicant runs. The utility must be compatible with the source MySQL server.

To ensure that you possess the appropriate version of `mysqlbinlog` utility, install the same MySQL server version as your source MySQL system. After installation, stop the MySQL server running on Replicant's host:

  ```BASH
  sudo systemctl stop mysql
  ```

### II. Enable binary logging in MySQL server

1. Open the MySQL option file `var/lib/my.cnf` (create the file if it doesn't already exist). Add the following lines in the file:

    ```SHELL
    [mysqld]
    log-bin=mysql-log.bin
    binlog_format=ROW
    binlog_row_image=full
    ```

    The preceding option file specifies the following binary logging options:
    <ol type="i">
    <li>
    
    The first line [specifies the base name to use for binary log files](https://dev.mysql.com/doc/refman/8.0/en/replication-options-binary-log.html#option_mysqld_log-bin).</li>

    <li>
    
    The second line [sets the binary logging format](https://dev.mysql.com/doc/refman/8.0/en/replication-options-binary-log.html#sysvar_binlog_format).</li>
    
    <li>
    
    The third line [specifies how the server writes row images to the binary log](https://dev.mysql.com/doc/refman/5.7/en/replication-options-binary-log.html#sysvar_binlog_row_image). In `full` mode, the server logs all columns in both the before image and the after image.</li>
    </ol>

2. Export `$MYSQL_HOME` path:
    ```SQL
    export MYSQL_HOME=/var/lib/mysql
    ```
3. Restart MySQL service:
  
    ```BASH
    sudo systemctl restart mysql
    ```
4. Verify that you have successfully enabled binary logging:
    ```BASH
    mysql -u root -p
    ```
    ```SQL
    mysql> show variables like "%log_bin%";
    +---------------------------------+--------------------------------+
    | Variable_name                   | Value                          |
    +---------------------------------+--------------------------------+
    | log_bin                         | ON                             |
    | log_bin_basename                | /var/lib/mysql/mysql-bin       |
    | log_bin_compress                | OFF                            |
    | log_bin_compress_min_len        | 256                            |
    | log_bin_index                   | /var/lib/mysql/mysql-bin.index |
    | log_bin_trust_function_creators | OFF                            |
    | sql_log_bin                     | ON                             |
    +---------------------------------+--------------------------------+
    7 rows in set (0.011 sec)
    ```

### III. Set up MySQL user for Replicant
1.	Create MySQL user:
    ```SQL
    CREATE USER 'USERNAME'@'REPLICANT_HOST' IDENTIFIED BY 'PASSWORD';
    ```
2.	Grant the following privileges on all tables relevant to the replication:
    ```SQL
    GRANT SELECT ON "USER_DATABASE"."TABLE_NAME" TO 'USERNAME'@'REPLICANT_HOST';
    ```
3.	Grant the `REPLICATION` privileges:
    ```SQL
    GRANT REPLICATION CLIENT ON *.* TO 'USERNAME'@'REPLICANT_HOST';
    GRANT REPLICATION SLAVE ON *.* TO 'USERNAME'@'REPLICANT_HOST';
    ```
4.	Verify that this new user can access binary logs:
    ```SQL
    mysql> show binary logs;
    +------------------+-----------+
    | Log_name         | File_size |
    +------------------+-----------+
    | mysql-bin.000001 |       351 |
    | mysql-bin.000002 |      4635 |
    | mysql-bin.000003 |       628 |
    | mysql-bin.000004 | 195038185 |
    +------------------+-----------+
    4 rows in set (0.001 sec)
    ```

Replace the following:

- *`USERNAME`*: the username for the user
- *`REPLICANT_HOST`*: the hostname of the machine running Replicant
- *`PASSWORD`*: the user password
- *`USER_DATABASE`*: the MySQL database name to grant privilege to
- *`TABLE_NAME`*: the relevant table name in *`USER_DATABASE`*


## I. Set up connection configuration
Specify your MySQL connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `mysql.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

To connect to MySQL, you can choose between two methods for an authenticated connection:
  - [Using username and password without SSL](#connect-with-username-and-password-without-ssl)
  - [Using SSL](#connect-using-ssl)

### Connect with username and password without SSL
To connect to MySQL with basic username and password authentication, you have these two options: 
{{< tabs "username-pwd-connection-method" >}}
{{< tab "Specify credentials in plain text" >}}
You can specify your credentials in plain form in the connection configuration file like the folowing sample:

```YAML
type: MYSQL

host: HOSTNAME_OR_IP
port: PORT_NUMBER

username: "USERNAME"
password: "PASSWORD"

slave-server-ids: [1]
max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000
```

Replace the following:

- *`HOSTNAME_OR_IP`*: the MySQL hostname or IP address
- *`PORT_NUMBER`*: the port number of MySQL host
- *`USERNAME`*: the MySQL username to connect to the MySQL server (the `user` part in MySQL account name `<’user’>@<’host’>`)
- *`PASSWORD`*: the password associated with *`USERNAME`*

{{< /tab >}}

{{< tab "Use a secrets management service" >}}
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}).
{{< /tab >}}
{{< /tabs>}}

### Connect using SSL
To connect to MySQL using SSL, specify the SSL configuration under the `ssl` field in the connection configuration file. When using this method, make sure you provide the `username` and don't provide `password`. 

```YAML
type: MYSQL

host: HOSTNAME_OR_IP
port: PORT_NUMBER

username: "USERNAME"

ssl:
  enable: true

  root-cert: PATH_TO_CA_PEM_FILE
  ssl-cert: PATH_TO_CLIENT_CERT_PEM_FILE
  ssl-key: PATH_TO_CLIENT_KEY_PEM_FILE

  hostname-verification: {true|false}

slave-server-ids: [1]
max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000
```

Replace the following:

- *`HOSTNAME_OR_IP`*: the MySQL hostname or IP address
- *`PORT_NUMBER`*: the port number of MySQL host
- *`USERNAME`*: the MySQL username to connect to the MySQL server (the `user` part in MySQL account name `<’user’>@<’host’>`)
- *`PATH_TO_CA_PEM_FILE`*: path to the certificate authority (CA) certificate PEM file–for example, `ca.pem`.
- *`PATH_TO_CLIENT_CERT_PEM_FILE`*: path to the client SSL public key certificate file in PEM format—for example, `client-cert.pem`.
- *`PATH_TO_CLIENT_KEY_PEM_FILE`*: path to the client private key—for example, `client-key.pem`.

`hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. It defaults to `true`.

{{< hint "info" >}}
**Tip:** You can [use SSL with TrustStore and KeyStore for snapshot replication](#use-ssl-with-truststore-and-keystore-in-snapshot-replication).
{{< /hint >}}

#### Connect to Amazon RDS for MySQL using SSL
To connect to RDS for MySQL using SSL, follow these steps:

1. Download a [certificate bundle](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html#UsingWithRDS.SSL.CertificatesAllRegions).
2. Set the `root-cert` parameter of the connection configuration file to the location of the PEM certificate bundle.

The following sample shows how to define a connection for RDS for MySQL:

```YAML
type: MYSQL

host: HOSTNAME_OR_IP
port: PORT_NUMBER

username: "USERNAME"
password: "PASSWORD"

slave-server-ids: [1]
max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000

ssl:
  enable: true
  root-cert: PATH_TO_PEM_BUNDLE
  hostname-verification: {true|false}
```

Replace the following:

- *`HOSTNAME_OR_IP`*: the RDS for MySQL hostname or IP address
- *`PORT_NUMBER`*: the port number of RDS for MySQL host
- *`USERNAME`*: the username to connect to the RDS for MySQL server (the `user` part in the account name `<’user’>@<’host’>`)
- *`PASSWORD`*: the password associated with *`USERNAME`*
- *`PATH_TO_PEM_BUNDLE`*: full path to the PEM certificate bundle—for example, `/home/arcion/us-east-1-bundle.pem`

`hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. It defaults to `true`.

### MYSQL native parquet export to S3
Arcion now provides a way to snapshot data from Amazon hosted MYSQL instance in parquet format to S3 buckets.
Add below additional fields in the connection configuration file:
```YAML
# Below entries are valid if extraction method is MYSQL_AWS_RDS
aws-db-instance-id: <db-instance-id>
stage-conn-config:
  key-id: <access-key>
  secret-key: <secret-key>
  region: "us-west-2"
  type: MYSQL_S3
  root-dir: "replicate-stage/test"    #specify a directory in S3 which can be used to stage bulk-load files.
  conn-url: <bucket_name>             # specify bucket name e.g. arcion-replicate-bucket
  assume-role:
    enable: true
    role-arn: <role-arn>
  encryption:
    type: NONE
    key:  <kms-key-id>
```
{{< hint "info" >}}**Note:** You need to set `extraction-method: MYSQL_AWS_RDS` parameter in the [extractor file](#configure-snapshot-replication).{{< /hint >}}
## II. Set up filter configuration (optional)
If you want to define filter rules for source MySQL, specify the them in the filter configuration file. You can find a sample filter configuration file in the `filter/` directory of your [Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}). 

For example:


```yaml
allow:
  catalog: "tpch"
  types: [TABLE]

  allow:
    NATION:
        allow: ["US, AUS"]

    ORDERS:  
        allow: ["product", "service"]
        conditions: "o_orderkey < 5000"

    PART:
```

  The preceding sample consists of the following elements:

  - Data of object type `TABLE` in the schema `tpch` goes through replication.
  - From catalog `tpch`, only the `NATION`, `ORDERS`, and `PART` tables go through replication.
  - From `NATION` table, only the `US` and `AUS` columns go through replication.
  - From the `ORDERS` table, only the `product` and `service` columns go through replication as long as those columns meet the condition in `conditions`.

{{< hint "info" >}}**Note:** Unless you specify, Replicant replicates all tables in the catalog.{{< /hint >}}

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

For a thorough explanation of filters, see [Filter Reference]({{< ref "docs/sources/configuration-files/filter-reference" >}}).

## III. Set up Extractor configuration
To configure replication according to your requirements, specify your configuration in the Extractor configuration file. You can find a sample Extractor configuration file `mysql.yaml` in the `$REPLICANT_HOME/conf/src` directory. For a thorough explanation of the configuration parameters in the Extractor file, see [Extractor Reference]({{< ref "docs/sources/configuration-files/extractor-reference" >}} "Extractor Reference").

You can configure the following [replication modes]({{< ref "running-replicant" >}}) by specifying the parameters under their respective sections in the configuration file:

- `snapshot`
- `realtime`
  
See the following sections for more information.

### Configure `snapshot` replication
The following illustrates a sample configuration for operating in [`snapshot` mode]({{< ref "running-replicant#replicant-snapshot-mode" >}}):

```YAML
    snapshot:
      threads: 16
      fetch-size-rows: 15_000

      per-table-config:
      - catalog: tpch
        tables:
          ORDERS:
            num-jobs: 1
          LINEITEM:
            row-identifier-key: [L_ORDERKEY]
            split-key: l_orderkey
```

For more information about the configuration parameters for `snapshot` mode, see [Snapshot Mode]({{< ref "docs/sources/configuration-files/extractor-reference#snapshot-mode" >}}).

### Configure `realtime` replication
To operate in [`realtime` mode]({{< ref "running-replicant#replicant-realtime-mode" >}}), follow these steps:

1. For real-time replication, you must create a heartbeat table in the source MySQL. To create a heartbeat table in the catalog or schema you want to replicate, use the following DDL:
   
    ```SQL
    CREATE TABLE `<user_database>`.`replicate_io_cdc_heartbeat`(
      timestamp BIGINT NOT NULL,
      PRIMARY KEY(timestamp));
    ```
    Replace `<user_database>` with the name of your specific database—for example, `tpch`.

2. Grant `INSERT`, `UPDATE`, and `DELETE` privileges to the user for the heartbeat table.

3. Specify your configuration under the `realtime` section of the Extractor configuration file. For example:
    ```YAML
    realtime:
      threads: 4
      fetch-size-rows: 10_000
      fetch-duration-per-extractor-slot-s: 3
      _traceDBTasks: true

      heartbeat:
        enable: true
        catalog: tpch
        table-name: replicate_io_cdc_heartbeat
        column-name: timestamp
    ```

    In the preceding example, notice the following about the `heartbeat` configuration corresponding to the heartbeat table in the first step:
    <ol type="a">
    <li>
    
    `tpch` represents the name of the database that contains the heartbeat table.</li>
    <li>
    
    `replicate_io_cdc_heartbeat` represents the heartbeat table's name.</li>
    <li>
    
    `timestamp` represents the heartbeat table's column name.</li>
    </ol>

For more information about the configuration parameters for `realtime` mode, see [Realtime Mode]({{< ref "docs/sources/configuration-files/extractor-reference#realtime-mode" >}}).
#### Additional `realtime` parameters
<dl class="dl-indent">
<dt><code>bin-log-idle-timeout-s</code></dt>
<dd>

In some cases, a `mysqlbinlog` process might not produce any output. This parameter specifies after how many seconds the replication restarts such a `mysqlbinlog` process.

_Default: `600`._
</dd>
</dl>

#### Support for DDL replication
Replicant [supports DDL replication for real-time MySQL source]({{< ref "docs/sources/ddl-replication" >}}). For more information, [contact us](https://arcion.io/contact).

{{< hint "info" >}}
**Note:** If you want to use the Source Column Transformation feature of Replicant for a _MySQL-to-Databricks_ pipeline, see [Source Column Transformation]({{< ref "docs/sources/configuration-files/source-column-transformation" >}}).
{{< /hint >}}

## Replication of generated columns
Replicant supports replication of generated columns from MySQL to either a different database platform, or another MySQL database.

Arcion supports replication of generated columns for the following Replicant modes:

- [`snapshot`]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}})
- [`realtime`]({{< ref "docs/running-replicant#replicant-realtime-mode" >}})
- [`full`]({{< ref "docs/running-replicant#replicant-full-mode" >}})
- [`fetch-schemas`]({{< ref "docs/running-replicant#fetch-schemas" >}})
- [`infer-schemas`]({{< ref "docs/running-replicant#infer-schemas" >}})

The behavior of replicating generated columns depends on the type of replication pipeline and your usage of the configuration parameters. See the following sections for more information.

### Configuration parameters
Use the following [Extractor configuration parameters](#extractor-parameters) and [CLI option](#cli-option) to control replication of generated columns.

{{< hint "warning" >}}
**Warning:**  If you specify [`create-sql`](#cli-option) or `fetch-create-sql`, only use schema name or database name in [Mapper file]({{< ref "docs/targets/configuration-files/mapper-reference" >}}). Any Mapper rule with column names, table names, or others raises Exception.
{{< /hint >}}

#### Extractor parameters
You can specify these parameters in the Extractor configuration file of MySQL.

<dl class="dl-indent">
<dt>

`computed-columns`</dt>
<dd>
Whether to block or unblock replication of generated columns. It can take one of the following two values:

- `BLOCK`
- `UNBLOCK`

The behavior of `BLOCK` and `UNBLOCK` depends on the type of replication pipeline and how you use the [`create-sql`](#cli-option) or `fetch-create-sql` parameters.

</dd>

<dt>

`fetch-create-sql`</dt>
<dd>
A boolean parameter supporting the following two values:

- **`true`**. Replicant replicates the generated columns to the target without skipping data types and functions. This means that the tables possess the same definitions as the source.
- **`false`**. Replicant replicates generated columns with the following characteristics:

    - Replicant only replicates the data type and the data.
    - Replicant skips replicating functions. The target database table possesses different definition than the one on the source. Replicant treats generated columns as ordinary columns.

{{< hint "warning" >}}
**Warning:** Replicant doesn't support `fetch-create-sql` for [heterogeneous pipelines](#replication-of-generated-columns-in-heterogeneous-pipeline). Any usage of `fetch-create-sql` in a heterogeneous pipeline raises Exception.
{{< /hint >}}

</dd>

The following shows a sample Extractor configuration for a [homogeneous pipeline](#replication-of-generated-columns-in-homogeneous-pipeline):

```YAML
snapshot:  
  threads: 16
  fetch-size-rows: 15_000
  min-job-size-rows: 1_000_000  
  max-jobs-per-chunk: 32
  computed-columns: UNBLOCK 
  fetch-user-roles: true
  fetch-create-sql : true
```

The preceding sample instructs Replicant to replicate generated columns with data, corresponding data types, and functions.

#### CLI option
Replicant self-hosted CLI exposes a CLI option `create-sql`. `create-sql` yields the same outcome as setting `fetch-create-sql` to `true`.

`create-sql` holds a higher precedence than the Extractor parameter `fetch-create-sql`. If you run Replicant with the `create-sql` option, Replicant ignores the value of `fetch-create-sql`.

The following shows a sample command for running Replicant:

```sh
./bin/replicant full conf/conn/mysql_src.yaml conf/conn/mysql_dst.yaml \
--filter filter/mysql_filter.yaml \
--extractor conf/src/mysql.yaml \
--metadata conf/metadata/postgresql.yaml \
--replace-existing --id mf2 \
--overwrite --create-sql
```

The preceding command instructs Replicant to replicate the generated columns with data, the corresponding data types, and functions.

{{< hint "warning" >}}
**Warning:** Replicant doesn't support `create-sql` for [heterogeneous pipelines](#replication-of-generated-columns-in-heterogeneous-pipeline). Any usage of `create-sql` in a heterogeneous pipeline raises Exception.
{{< /hint >}}

### Replication of generated columns in heterogeneous pipeline
A heterogeneous pipeline means replication between two different database platforms. For example, a MySQL-to-PostgreSQL replication pipeline.

For a heterogeneous pipeline, set the `computed-columns` property to one of the following values in your Extractor configuration file:

#### `BLOCK`
Replicant skips replicating generated columns. No generated columns from your source MySQL exists in the target database you're replicating to.

#### `UNBLOCK`
Replicant replicates generated columns from source MySQL with the following caveats:

- Replicant only replicates the data type and the data.
- Replicant skips replicating functions. The target database table possesses different definition than the one on the source. Replicant treats generated columns as ordinary columns.

### Replication of generated columns in homogeneous pipeline
A homogeneous pipeline means replication between two identical database platforms. For example, a MySQL-to-MySQL replication pipeline.

For a homogeneous pipeline, `computed-columns` behaves in the following manner. The behavior depends on the usage of the [`create-sql`](#cli-option) or `fetch-create-sql` parameters:

<dl class="dl-indent" >
<dt>

With `fetch-create-sql` or `create-sql` enabled
</dt>
<dd>

If you set `fetch-create-sql` to `true` or specify [the `create-sql` CLI option](#cli-option), Replicant replicates data and corresponding data types as well as the functions. This means that table definition on the target stays the same as source. The value of `computed-columns` holds no effect in this scenario.
</dd>

<dt>

With `fetch-create-sql` or `create-sql` disabled</dt>
<dd>

If you set `fetch-create-sql` to `false` or omit [the `create-sql` CLI option](#cli-option), the behavior follows the same pattern as a [heterogeneous pipeline](#replication-of-generated-columns-in-heterogeneous-pipeline).
</dl>

## Use SSL with TrustStore and KeyStore in snapshot replication
You can use TrustStore and KeyStore that contains the necessary SSL certificates for SSL connection in [`snapshot` mode replication]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}). If you use this approach, don't specify the `ssl.root-cert`, `ssl.ssl-cert`, and `ssl.ssl-key` parameters in the connection configuration file.

To use SSL with TrustStore and KeyStore in snapshot replication, follow these instructions:

### Create the TrustStore and KeyStore on the host running Replicant
1. Import the certificate authority (CA) certificate PEM file (for example `ca.pem`):

    ```sh
    keytool -importcert -alias MySQLCACert -file /path/to/ca.pem \
    -keystore TRUSTSTORE_LOCATION \
    -storepass TRUSTORE_PASSWORD -noprompt
    ```


    Replace the following:
    - *`TRUSTSTORE_LOCATION`*: The TrustStore location. It corresponds to the `ssl.trust-store.path` parameter [in the SSL configuration](#specify-ssl-configuration-in-the-connection-configuration-file).
    - *`TRUSTORE_PASSWORD`*: The TrustStore password. It corresponds to the `ssl.trust-store.password` parameter [in the SSL configuration](#specify-ssl-configuration-in-the-connection-configuration-file).

    The `ca.pem` file corresponds to the `ssl.root-cert` field [in the SSL configuration](#specify-ssl-configuration-in-the-connection-configuration-file).


2. Once you have the client private key (for example, `client-key.pem`) and certificate files (for example, `client-cert.pem`) you want to use, import them into a Java KeyStore:

   <ol type="a">
   <li>

   Convert the client key and certificate files to a PKCS #12 archive:

   ```sh
   openssl pkcs12 -export -in /path/to/client-cert.pem -inkey /path/to/client-key.pem \
   -name "NAME" -passout pass:PASSWORD \
   -out client-keystore_src.p12
   ```

   Replace the following: 
   
   - *`PASSWORD`*: the password source for output files
   - *`NAME`*: a name for the certificate and key

   For more information, see [the `openssl-pkcs12` manpage](https://www.openssl.org/docs/manmaster/man1/openssl-pkcs12.html).

   The `client-key.pem` and `client-cert.pem` files correspond to the `ssl.ssl-key` and `ssl.ssl-cert` parameters respectively [in the SSL configuration](#specify-ssl-configuration-in-the-connection-configuration-file).  
   </li>

   <li>

   Import the client key and certificate into a Java KeyStore:

   ```sh
   keytool -importkeystore -srckeystore client-keystore_src.p12 \ 
   -srcstoretype pkcs12 -srcstorepass SRC_KEYSTORE_PASSWORD \
   -destkeystore NAME_OF_THE_DST_KEYSTORE_FILE -deststoretype JKS \
   -deststorepass DST_KEYSTORE_PASSWORD
   ```

   Replace the following:
   - *`SRC_KEYSTORE_PASSWORD`*: Source KeyStore password.
   - *`NAME_OF_THE_DST_KEYSTORE_FILE`*: Name of the destination KeyStore file. Corresponds to the `ssl.key-store.path` parameter [in the SSL configuration](#specify-ssl-configuration-in-the-connection-configuration-file).
   - *`DST_KEYSTORE_PASSWORD`*: Destination KeyStore password. Corresponds to the `ssl.key-store.password` parameter [in the SSL configuration](#specify-ssl-configuration-in-the-connection-configuration-file).

   If you get an error with the preceding command, make sure to use the same password for both `srcstorepass` and `deststorepass`. For more information, see [`keytool-importkeystore` documentation](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html#keytool_option_importkeystore).
   </li>
   </ol>
The following message appears after you execute the preceding commands successfully:

> Entry for alias MySQLCACert successfully imported.<p>Import command completed:  1 entries successfully imported, 0 entries failed or cancelled</p>

#### Specify SSL configuration in the connection configuration file
Specify the SSL configuration under the `ssl` field in the connection configuration file. When using this method, make sure you provide the `username` and don't provide `password`.:

```YAML
type: MYSQL


host: HOSTNAME_OR_IP
port: PORT_NUMBER

username: "USERNAME"

slave-server-ids: [1]
max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000

ssl:
  enable: true

  hostname-verification: {true|false}

  trust-store:                     
    path: PATH_TO_TRUSTORE
    password: "TRUSTSTORE_PASSWORD"
  key-store:                        
    path: PATH_TO_KEYSTORE
    password: "KEYSTORE_PASSWORD"
```

Replace the following:

- *`HOSTNAME_OR_IP`*: the MySQL hostname or IP address
- *`PORT_NUMBER`*: the port number of MySQL host
- *`USERNAME`*: the MySQL username to connect to the MySQL server (the `user` part in MySQL account name `<’user’>@<’host’>`)
- *`PATH_TO_TRUSTSTORE`*: path to the TrustStore.
- *`TRUSTSTORE_PASSWORD`*: the TrustStore password.
- *`PATH_TO_KEYSTORE`*: path to the Java KeyStore.
- *`KEYSTORE_PASSWORD`*: the KeyStore password.

`hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. It defaults to `true`.
