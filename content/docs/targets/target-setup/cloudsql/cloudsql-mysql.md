---
pageTitle: Cloud SQL for MySQL connector by Arcion  
title: MySQL
description: "Get fast data ingestion into Google's Cloud SQL for MySQL with Arcion's dedicated connector."
url: docs/target-setup/cloudsql-for-mysql
bookHidden: false
---

# Destination Cloud SQL for MySQL
This page describes how to load data in real time into [Google's Cloud SQL for MySQL](https://cloud.google.com/sql/mysql), a fully managed service for MySQL relational database.

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/#ii-download-replicant-and-create-a-home-repository" >}}) download as the `$REPLICANT_HOME` directory.

## Prerequisites
Pay attention to the following before configuring MySQL as the Target system:

- To replicate tables into the catalogs or schemas you need, make sure that the specified user possesses the `CREATE TABLE` and `CREATE TEMPORARY TABLE` privileges on those catalogs and schemas.
- If you want Replicant to create catalogs or schemas for you on the target Cloud SQL for MySQL system, then you must grant `CREATE DATABASE` or `CREATE SCHEMA` privileges respectively to the user.
- If the user does not have `CREATE DATABASE` privilege, the follow these steps:
    1. Create a database manually with name `io_blitzz`.
    2. Grant all privileges for the `io_blitzz` database to that user. 
    
    Replicant uses this `io_blitzz` database to maintain internal checkpoints and metadata.

## I. Set up connection configuration
Specify your connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `cloudsql_mysql.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

To connect to MySQL, you can choose between two methods for an authenticated connection:
- [Using basic username and password authentication](#connect-with-username-and-password)
- [Using SSL](#connect-using-ssl)

### Connect with username and password
You can specify your credentials in plain text in the connection configuration file in the following manner:

```YAML
type: CLOUDSQL_MYSQL

host: CLOUDSQL_MYSQL_IP
port: PORT_NUMBER

database: 'DATABASE_NAME'
username: 'USERNAME'
password: 'PASSWORD'

max-connections: 30
max-retries: 10
retry-wait-duration-ms: 1000
socket-timeout-s: 60
```

Replace the following:

- *`CLOUDSQL_MYSQL_IP`*: the IP address of the Cloud SQL for MySQL instance
- *`PORT_NUMBER`*: the port number
- *`DATABASE_NAME`*: the database name
- *`USERNAME`*: the username of the *`DATABASE_NAME`* user 
- *`PASSWORD`*: the password associated with *`USERNAME`*

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in Cloud SQL instance
- *`max-retries`*: number of times Replicant retries a failed operation
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads.

The following shows a sample connnection configuration:

```YAML
type: CLOUDSQL_MYSQL

host: 12.34.456.78
port: 57565

username: "replicant"
password: "Replicant#123"

max-connections: 30

max-retries: 10
retry-wait-duration-ms: 1000
```

### Connect using SSL
To connect to Cloud SQL for MySQL using SSL, follow these steps:

#### Create the TrustStore and KeyStore on the host running Replicant
  
  1. Import the Certificate Authority (CA) certificate PEM file (for example `ca.pem`):
  
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
      keytool -importkeystore -srckeystore client-keystore_src.p12 
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
{{< tabs "ssl-config-in-connection-config-file" >}}

{{< tab "Realtime and full mode replication" >}}
For CDC-based replication using [`realtime`]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}) and [`full`]({{< ref "docs/#running-replicant#replicant-full-mode" >}}) mode, specify the SSL configuration under the `ssl` field in the connection configuration file:

```YAML
ssl:
  enable: true
  root-cert: PATH_TO_CA_PEM_FILE
  ssl-cert: PATH_TO_CLIENT_CERT_PEM_FILE
  ssl-key: PATH_TO_CLIENT_KEY_PEM_FILE

  hostname-verification: {true|false}

  trust-store:                     
    path: PATH_TO_TRUSTORE
    password: "TRUSTSTORE_PASSWORD"
  key-store:                        
    path: PATH_TO_KEYSTORE
    password: "KEYSTORE_PASSWORD"
```

Replace the following:

- *`PATH_TO_CA_PEM_FILE`*: path to the Certificate Authority (CA) certificate PEM file–for example, `ca.pem`.
- *`PATH_TO_CLIENT_CERT_PEM_FILE`*: path to the client SSL public key certificate file in PEM format—for example, `client-cert.pem`.
- *`PATH_TO_CLIENT_KEY_PEM_FILE`*: path to the client private key—for example, `client-key.pem`.
- *`PATH_TO_TRUSTSTORE`*: path to the TrustStore.
- *`TRUSTSTORE_PASSWORD`*: the TrustStore password.
- *`PATH_TO_KEYSTORE`*: path to the Java KeyStore.
- *`KEYSTORE_PASSWORD`*: the KeyStore password.

`hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. It defaults to `true`.

{{< /tab >}}


{{< tab "Snapshot replication" >}}
For [`snapshot`]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}) mode replication, specify the SSL configuration under the `ssl` field in the connection configuration file:

```YAML
```YAML
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

- *`PATH_TO_TRUSTSTORE`*: path to the TrustStore.
- *`TRUSTSTORE_PASSWORD`*: the TrustStore password.
- *`PATH_TO_KEYSTORE`*: path to the Java KeyStore.
- *`KEYSTORE_PASSWORD`*: the KeyStore password.

`hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. It defaults to `true`.
{{< /tab >}}
{{< /tabs >}}

## II. Configure mapper file (optional)
If you want to define data mapping from your source to Cloud SQL for MySQL, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}).

For example, the following sample applies to a MySQL-to-Cloud SQL for MySQL pipeline:

```YAML
rules:
  [tpch]:
    source:
    - tpch
    tables:
      DST_PART:
        source:
          [tpch, PART]:
      DST_ORDERS:
        source:
          [tpch, ORDERS]:
```

## III. Configure metadata (optional)
To ensure fault tolerance and resilience in replication, Arcion Replicant needs to maintain a number of metadata tables. Replicant uses a metadata configuration file to handle metadata-related operations. For more information, see [Metadata configuration]({{< ref "docs/references/metadata-reference" >}}).

The following shows a sample metadata configuration:

```YAML
type: MYSQL

connection:
  host: localhost
  port: 53585

  username: 'replicant'
  password: 'Replicant#123'
  max-connections: 30


catalog: io_replicate
```

## IV. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `cloudsql_mysql.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

### Configure `snapshot` mode
For operating in [`snapshot` mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the configuration file. For example:

```YAML
snapshot:
  threads: 32
  batch-size-rows: 10_000
  txn-size-rows: 1_000_000

  bulk-load:
    enable: true
    type: FILE

  skip-tables-on-failures : true
  _traceDBTasks: true
  handle-failed-opers: true
  use-upsert-based-recovery: false
  fk-cycle-resolution-method: REMOVE_FK   # BLOCK_TABLES to break cycle or REMOVE_FK(default) to remove constraint

  user-role:
    init-user-roles: true
```

{{< hint "warning" >}}
**Caution:** By default, MySQL disables local data loading which causes bulk loading to fail. So if you want to use bulk loading, make sure to set [the `local_infile` system variable](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_local_infile) to `1` in your [MySQL option file](https://dev.mysql.com/doc/refman/8.0/en/option-files.html).
{{< /hint >}}

For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "docs/targets/configuration-files/applier-reference#snapshot-mode" >}}).

### Configure real-time replication
For operating in [`realtime` mode]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}) or [`full` mode]({{< ref "docs/running-replicant#replicant-full-mode" >}}), specify your configuration under the `realtime` section of the conifiguration file. For example:

```YAML
realtime:
  threads: 32
  batch-size-rows: 10_000
  txn-size-rows: 1_00_000
  replay-replace-as-upsert: false
  skip-tables-on-failures : false
  handle-failed-opers: true

# Transactional mode config
# realtime:
#   threads: 1
#   batch-size-rows: 1000
#   replay-consistency: GLOBAL
#   txn-group-count: 100
#   _oper-queue-size-rows: 20000
#   skip-upto-cursors: #last failed cursor
```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "docs/targets/configuration-files/applier-reference#realtime-mode" >}}).
