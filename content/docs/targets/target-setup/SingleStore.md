---
pageTitle: Documentation for SingleStore Target connector
title: SingleStore
description: "Learn how to ingest data to SingleStore for analytics and ML, using Arcion's bleeding-edge CDC technology to keep data up-to-date."
url: docs/target-setup/singlestore
bookHidden: false
---
# Destination SingleStore

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## Prerequisites
You must have a user configured in SingleStore for replication with `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP` permissions on application databases.

If SingleStore user does not have create database permission then you must create a database named `io_replicate` and provide `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP` privileges to SingleStore user.

## I. Setup Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample SingleStore connection configuration file:
    ```BASH
    vi conf/conn/singlestore.yaml
    ```

2. For connecting to the SingleStore server, you can choose between two methods for an authenticated connection:

    - [Using basic username and password authentication](#connect-with-username-and-password).
    - [Using SSL](#connect-using-ssl).

    ### Connect with username and password
    For connecting to SingleStore using via basic username and password authentication, you have the following two options:

    {{< tabs "username-pwd-authentication" >}}
    {{< tab "Specify credentials in plain text" >}}

You can specify your credentials in plain form in the connection configuration file like the folowing sample:

  ```YAML
  type: SINGLESTORE

  host: HOSTNAME
  port: PORT_NUMBER

  username: 'USERNAME'
  password: 'PASSWORD'

  max-connections: 30
  max-retries: 10
  retry-wait-duration-ms: 1000
  ```

  Replace the following:

  - *`HOSTNAME`*: hostname of the SingleStore server
  - *`PORT_NUMBER`*: port number of the SingleStore server
  - *`USERNAME`*: the SingleStore username
  - *`PASSWORD`*: the password associated with *`USERNAME`*

  {{< /tab >}}

  {{< tab "Use a secrets management service" >}}
  You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
  {{< /tab >}}
  {{< /tabs >}}

    ### Connect using SSL
    To connect to SingleStore using SSL, follow these steps:

    1. Configure the server-side requirements by following the instructions in [Server Configuration for Secure Client and Intra-Cluster Connections](https://docs.singlestore.com/db/v8.0/en/security/encryption/ssl-secure-connections/server-configuration-for-secure-client-and-intra-cluster-connections.html).
    2. Specify the SSL parameters to Replicant in the `ssl` section of the connection configuration file in the following format:

        ```YAML
        ssl:
          enable: true
          root-cert: "PATH_TO_CA_CERTIFICATE_FILE" 
          hostname-verification: {true|false}      
          trust-store:                    
            path: PATH_TO_CA_TRUSTSTORE
            password: TRUSTSTORE_PASSWORD
          key-store:                       
            path: PATH_TO_KEYSTORE
            password: KEYSTORE_PASSWORD
          ssl-key-password: KEYSTORE_CERT_PASSWORD
        ```

        In the preceding configuration:
        - `root-cert` holds the full path to your SSL CA certificate file—for example, `"/home/alex/workspace/ca-cert.pem"`. Keep in mind that the `trust-store` configuration overrides `root-cert`.
        - `hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. Defaults to `true`.
        - `trust-store` holds the SSL CA certificate that the client uses to authenticate the server. This configuration overrides `root-cert`. 
        
          Replace *`PATH_TO_CA_TRUSTSTORE`* and *`TRUSTSTORE_PASSWORD`* with the path to the TrustStore and the TrustStore password respectively.
        - The server uses `key-store` to authenticate the client. Replace *`PATH_TO_KEYSTORE`* and *`KEYSTORE_PASSWORD`* with the path to the KeyStore and the KeyStore password respectively.
        - As an optional parameter, `ssl-key-password` holds the password of the certificate inside the KeyStore.
        
## II. Setup Applier Configuration

Edit the applier configurations if required.  

1. From `$REPLICANT_HOME`, navigate to the sample Applier Configuration File:
   ```BASH
   vi conf/dst/singlestore.yaml
   ```

2.  The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to realtime mode. 
  
    ### Parameters related to snapshot mode
    For snapshot mode, notice the sample configuration below:

    ```YAML
    snapshot:
      table-store: {ROW|COLUMN}
      per-table-config:
      - catalog: tpch
        tables:
          singlestore_orders:
            table-store: COLUMN
            sort-key: [singlestore_orderkey] 
            shard-key: [c2]
    ```

    In the sample above, notice the following:
    - You can provide SingleStore LOAD configuration string by setting the `native-load-configs` parameter. These configurations will be appended to the generated LOAD SQL command. For example:
     
      ```YAML
      native-load-configs: "ERRORS HANDLE 'orders_errors'"
      ```
    - You can specify the table store to use by setting the `table-store` parameter to any of the following two values:
      - `ROW`
      - `COLUMN`
    - Replace `singlestore_orderkey` with a list of columns to be created as the `sort-key`.
    - Replace `c2` with a list of columns to be created as the `shard-key`.
    
    ### Parameters related to realtime mode
    For realtime mode, notice the following sample:

    ```YAML
    realtime:
      threads: 8
      txn-size-rows: 10000
      batch-size-rows: 1000
      _oper-queue-size-rows: 20000
      skip-tables-on-failures : false
      replay-shard-key-update-as-delete-insert: true
      retry-failed-txn-idempotently: true
        perTableConfig:
        - schema: tpch
          tables:
            CUSTOMER:
              skip-upto-cursor: '{"extractorId":0,"timestamp":1599201466000,"log":"mariadb-bin.000200","position":36574666,"logSeqNum":1000,"slaveServerId":1,"v":1}'
    ```

3. Below is a sample applier file with commonly used configuration parameters:
    ```YAML
    snapshot:
      threads: 32
      batch-size-rows: 10_000
      txn-size-rows: 1_000_000

      bulk-load:
        enable: true
        type: FILE
        

      table-store: ROW
      per-table-config:
      - catalog: tpch
        tables:
          singlestore_orders:
            table-store: COLUMN
            sort-key: [singlestore_orderkey]
            shard-key: [c2]
          partsupp:
            table-type: REFERENCE
            table-store: ROW
          partsupp_macro_delta:
            table-store: COLUMN
            sort-key: [partkey, suppkey]

    realtime:
      threads: 8
      txn-size-rows: 10000
      batch-size-rows: 1000
      _oper-queue-size-rows: 20000
      replay-shard-key-update-as-delete-insert: true
      retry-failed-txn-idempotently: true
    ```
    
For a detailed explanation of configuration parameters in the Applier file, read: [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference")
