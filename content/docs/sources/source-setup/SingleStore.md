---
pageTitle: Documentation for SingleStore Source connector
title: SingleStore
description: "Set up SingleStore as Source for zero-maintenance data pipelines using Arcion SingleStore connector."
url: docs/source-setup/singlestore
bookHidden: false
---

# Source SingleStore

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:

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

  You can specify your credentials in plain form in the connection configuration file like the following sample:
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
   
## II. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the Extractor configuration file:
   ```BASH
   vi conf/src/singlestore.yaml
   ```
    a. For snapshot mode, make the necessary changes as follows in the `snapshot` section of the configuration file:

    ```YAML
    snapshot:
      #threads: 32
      #fetch-size-rows: 10_000

      #min-job-size-rows: 1_000_000
      max-jobs-per-chunk: 32
      #verify-row-count: false
      _traceDBTasks: true

      per-table-config:
      - catalog: tpch
        tables:
    #     testTable
    #       split-key: split-key-column
          part:
            split-key: partkey
          partsupp:
            split-key: partkey
          supplier:
          orders:
            split-key: orderkey
          lineitem:
            row-identifier-key: [l_orderkey, l_linenumber]
            split-key: l_orderkey
    #        split-hints:
    #          row-count-estimate: 15000
    #          split-key-min-value: 1
    #          split-key-max-value: 60_000
    ```

    b. For delta snapshot mode, you can add `delta-snapshot-key` column to SingleStore tables if not present already with the following `ALTER` (and `UPDATE`) statement per table.

    ```SQL
    ALTER TABLE tpch.LINEITEM_CS ADD COLUMN replicate_io_delta_snapshot_key TIMESTAMP NOT NULL DEFAULT current_timestamp ON UPDATE current_timestamp;
    ```
    ```SQL
    UPDATE tpch.LINEITEM_CS set replicate_io_delta_snapshot_key = current_timestamp;
    ```
    Then make the necessary changes as follows in the `delta-snapshot` section of the configuration file:

    ```YAML
    delta-snapshot:
      #threads: 32
      #fetch-size-rows: 10_000

      #min-job-size-rows: 1_000_000
      max-jobs-per-chunk: 32
      _max-delete-jobs-per-chunk: 32

      delta-snapshot-key: last_update_time
      delta-snapshot-interval: 10
      delta-snapshot-delete-interval: 10
      _traceDBTasks: true
      replicate-deletes: false

      per-table-config:
      - schema: tpch
        tables:
    #      testTable
    #        split-key: split-key-column  # Any numeric/timestamp column with sufficiently large number of distincts
    #        split-hints:
    #          row-count-estimate: 100000  # Estimated row count, if supplied replicant will leverage
    #          split-key-min-value: 1      #Lower bound of split key value
    #          split-key-max-value: 60_000 #Upper bound of split key value, if supplied replicant will leverage and avoid querying source database for the same
    #        delta-snapshot-key: delta-snapshot-key-column  # A monotonic increasing numeric/timestamp column which gets new value on each INSERT/UPDATE
    #        row-identifier-key: [col1, col2]   # A set of columns which uniquely identify a row
    #        update-key: [col1, col2]  # A set of columns which replicant should use to perform deletes/updates during incremental replication

          part:
            split-key: partkey
          partsupp:
            split-key: partkey
          supplier:
          orders:
            split-key: orderkey
          parts_view:
            update-key: [partkey]
            delta-snapshot-key: last_update_time
            split-key: last_update_time
          partsupp_macro:
            update-key: [partkey]
            delta-snapshot-key: last_update_time
            split-key: last_update_time
    ```

For a detailed explanation of configuration parameters in the extractor file, read [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").