---
pageTitle: Ingest data into MySQL
title: MySQL
description: "Using Arcion's high-performance replication engine, load data into MySQL. Securely connect with necessary permissions and enable native-fast bulk-loading."
url: docs/target-setup/mysql
bookHidden: false   
---
# Destination MySQL

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Prerequisites
Pay attention to the following before configuring MySQL as the Target system:

- To replicate tables into the catalogs or schemas you need, make sure that the specified user possesses the `CREATE TABLE` and `CREATE TEMPORARY TABLE` privileges on those catalogs and schemas.
- If you want Replicant to create catalogs or schemas for you on the target MySQL system, then you must grant `CREATE DATABASE` or `CREATE SCHEMA` privileges respectively to the user.
- If the user does not have `CREATE DATABASE` privilege, create a database manually with name `io_blitzz` and grant all privileges for it to the user specified here. Replicant uses this database to maintain internal checkpoints and metadata.

## IV. Set up connection configuration
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

{{< tab "Fetch credentials from AWS Secrets Manager" >}}
If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}).
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

## III. Set up Applier configuration

1. From `$REPLICANT_HOME`, naviagte to the sample MySQL Applier configuration file:
    ```BASH
    vi conf/dst/mysql.yaml
    ```
2. Make the necessary changes as follows:
    ```YAML
    snapshot:
      threads: 16 #Specify the maximum number of threads Replicant should use for writing to the target

      #If bulk-load is used, Replicant will use the native bulk-loading capabilities of the target database
      bulk-load:
        enable: true|false #Set to true if you want to enable bulk loading
        type: FILE|PIPE #Specify the type of bulk loading between FILE and PIPE
        serialize: true|false #Set to true if you want the generated files to be applied in serial/parallel fashion

        #For versions 20.09.14.3 and beyond
        native-load-configs: #Specify the user-provided LOAD configuration string which will be appended to the s3 specific LOAD SQL command
    ```
{{< hint "warning" >}}
**Caution:** By default, MySQL disables local data loading which causes bulk loading to fail. So if you want to use bulk loading, make sure to set [the `local_infile` system variable](https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_local_infile) to `1` in your [MySQL option file](https://dev.mysql.com/doc/refman/8.0/en/option-files.html).
{{< /hint >}}

For a detailed explanation of configuration parameters in the applier file, read [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").

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
