---
pageTitle: Snowflake Source connector
title: Snowflake
description: "Get more out of Snowflake Data Cloud with Arcion. Use RSA key pair authentication, configure stage and Extractor, and enjoy fast, real-time replication."
url: docs/source-setup/snowflake
bookHidden: false
---

# Source Snowflake
The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#downloading-replicant-and-creating-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## Prerequisites for CDC-based replication
Make sure that you possess the following object privileges for CDC-based replication:

| Object   | Privilege |
|----------|-----------|
| `DATABASE` | `USAGE`                                        |
| `SCHEMA`   | `USAGE`, `CREATE`                              |
| `TABLE`    | `SELECT`, `CREATE STREAM`,  `CREATE TABLE`     |

## Limitations
### Real-time replication
- Streams may become stale over time. For more information, see [Data Retention Period and Staleness
](https://docs.snowflake.com/en/user-guide/streams-intro#data-retention-period-and-staleness). 
- Snowflake can extract data on a per-table basis. Therefore, you don't need to create heartbeat table manually.

{{< hint "danger" >}}
**Warning:** If a stream goes stale, Replicant drops and recreates the stream. This might cause data loss. So we highly recommend that you take necessary measures so that streams don't become stale.
{{< /hint >}}

### Native export
- Snowflake native export should only be used when the Applier supports file-based bulk loading.
- We recommend that you use S3 as the stage only when the Applier utilizes S3 as the stage for bulk loading. Otherwise, replication performs similarly to the `NATIVE` stage type.
- When using the CSV file format, make sure that the same `native-extract-options` exist in both the Extractor and Applier configurations.
- Parquet files might produce an error with `TIMESTAMP_TZ` or `TIMESTAMP_LTZ` data.
- For all general limitations and notes, see [Usage notes for the `COPY INTO` command](https://docs.snowflake.com/en/sql-reference/sql/copy-into-location#usage-notes).

## I. Set up connection configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:

   ```BASH
   vi conf/conn/snowflake.yaml
   ```

2. The configuration file has two parts:

    - Parameters related to source Snowflake server connection.
    - Parameters related to stage configuration.

    ### Parameters related to Source Snowflake server connection
    {{< hint "info" >}}
  **Note:** All communications with Snowflake happens through port 443, the standard port for HTTPS. So all data is encrypted and secure with SSL by default.
    {{< /hint >}}
    For connecting to Source Snowflake server, you can choose between two methods for an authenticated connection: 
    - [RSA key pair authentication](#use-rsa-key-pair-for-authentication)
    - [Basic username and password authentication](#basic-username-and-password-authentication)

    #### Basic username and password authentication
    To connect to Snowflake using basic username and password authentication, you have three options:

    {{< tabs "basic-username-pwd-auth" >}}
    {{< tab "AWS Secrets Manager" >}}
  You can choose to store your username and password in AWS Secrets Manager, and tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}).
    {{< /tab >}}
    {{< tab "Credentials in plain text" >}}
  You can also specify your credentials in plain form in the connection configuration file like the sample below:

  ```YAML
  type: SNOWFLAKE

  host: SNOWFLAKE_HOSTNAME
  port: PORT_NUMBER 
  warehouse: "WAREHOUSE_NAME"

  username: "USERNAME"
  password: "PASSWORD"

  max-connections: 20 #Specify the maximum number of connections replicant can open in Snowflake
  max-retries: 10
  retry-wait-duration-ms: 1000
  ```

  Replace the following:
  
  - *`SNOWFLAKE_HOSTNAME`*: The Snowflake hostname. To find your Snowflake hostname, follow these steps:
    1. Go to the [Snowflake web interface](https://app.snowflake.com/) and sign in into your account.
    2. Click the **Account selector** toolbar in [the bottom of the left navigation menu](https://docs.snowflake.com/en/user-guide/ui-snowsight-gs#snowsight-gs-left-nav).
    3. Hover the mouse over your account and click **<span aria-hidden="true" translate="no"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#040022" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="feather feather-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></span> Copy account URL** in the items list.
  - *`PORT_NUMBER`*: The port number of Snowflake host.
  - *`WAREHOUSE_NAME`*: The name of the [Snowflake warehouse](https://docs.snowflake.com/en/sql-reference/ddl-virtual-warehouse.html#warehouse-resource-monitor-ddl).
  - *`USERNAME`*: The username to connect to the Snowflake server.
  - *`PASSWORD`*: The password associated with *`USERNAME`*.
  {{< /tab >}}
  {{< tab "Credentials store" >}}
  Replicant supports consuming `username` and `password` configurations from a _credentials store_ rather than having users specify them in plain text configuration file. You can use KeyStores to store your credentials related to your Snowflake server connections. Use the `credential-store` parameter for the credentials store details. 
  
  The following parameters are available under `credential-store`:

  - `type`: Type of the keystore. Allowed types are `PKCS12`, `JKS`, and `JCEKS`. 
  - `path` : Location of the key-store.
  - `key-prefix`:  You should create entries in the credential store for your configs using a prefix and specify the prefix here. For example, you can create keystore entries with aliases `snowflake1_username` and `snowflake1_password`. You can then specify the prefix here as `snowflake1_`.
  - `password`: This field is optional. If you don't specify the keystore password here, then you must use the UUID from your license file as the keystore password. Remember to keep your license file somewhere safe in order to keep the password secure.
    {{< /tab >}}
    {{< /tabs >}}

    #### Use RSA key pair for authentication
    You can also choose to use [Snowflake's key pair authentication support](https://docs.snowflake.com/en/user-guide/key-pair-auth.html) for enhanced authentication security instead of using basic authentication via username and password. 
    
    To set up key pair authentication using RSA keys, follow the steps below:

    <dl class="dl-indent">
    <dt>Generate the private key</dt>
    <dd>

    From your command line, execute the following command to generate an encrypted private key:

    ```sh
    openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -v1 PBE-SHA1-RC4-128 -out rsa_key.p8
    ```
    The command generates a private key in PEM format:

    ```
    -----BEGIN ENCRYPTED PRIVATE KEY-----
    MIIFHDBOBgkqhkiG9w0BBQ0wQTApBgkqhkiG9w0BBQwwHAQIK0h8dqI1n5sCAggA
    MAwGCCqGSIb3DQIJBQAwFAYIKoZIhvcNAwcECNDwqMf6Xx1pBIIEyNmf044S+pEQ
    ...
    -----END ENCRYPTED PRIVATE KEY-----
    ```
    {{< hint "info" >}}
  **Important:** The command above to generate an encrypted key prompts for a passphrase to grant access to the key. We recommend using a passphrase that complies with PCI DSS standards to protect the generated private key. Additionally, we recommend storing the passphrase in a secure location. When using an encrypted key to connect to Snowflake, you will need to input the passphrase during the initial connection. The use of the passphrase is only for protecting the private key; it's never to sent to Snowflake servers.

  To generate a long and complex passphrase based on PCI DSS standards, follow the steps below:

  - Go to the [PCI Security Standards Document Library](https://www.pcisecuritystandards.org/document_library).
  - For **PCI DSS**, select the most recent version and your desired language.
  - Complete the form to access the document.
  - Search for `Passwords/passphrases must meet the following:` and follow the recommendations for password/passphrase requirements, testing, and guidance.
    {{< /hint >}}
    </dd>
    <dt>Generate a public key</dt>
    <dd>

    From the command line, generate the public key by referencing the private key. The following command references the private key contained in a file named `rsa_key.p8` created in the [previous step](#generate-the-private-key):

    ```sh
    openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
    ```
    The command generates a public key in PEM format:

    ```
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAslwTa+Lj5SMI58GiDzWq
    0rwj4FBymfKzHT16RXecnMcx7uI6KsVpqfh9HH0FMb/3C6YEMeGPkaRmKvXYjM5s
    ...
    -----END PUBLIC KEY-----
    ```
    </dd>
    <dt>Store the private and public Keys securely</dt>
    <dd>

    After following the above steps, you should find the private and public key files saved in a local directory of your system. Note down the path to those files. The private key is stored using the PKCS#8 (Public Key Cryptography Standards) format and is encrypted using the passphrase you specified in the [first step](#generate-the-private-key).

    However, maintain caution in protecting the file from unauthorized access using the file permission mechanism provided by your operating system. It's your responsibility to secure the file when it's not being used.
    </dd>
    <dt>Assign the public key to a Snowflake user</dt>
    <dd>

    Execute the following command to assign the public key to a Snowflake user.

    ```sql
    alter user jsmith set rsa_public_key='MIIBIjANBgkqh...';
    ```

    {{< hint "info" >}}
  - Only security administrators (i.e. users with the SECURITYADMIN role) or higher can alter a user.
  - Exclude the public key delimiters in the SQL statement.
    {{< /hint >}}

    </dd>
    <dt>Verify the user's public key fingerprint</dt>
    <dd>

    Execute the following command to verify the user’s public key:

    ```sql
    DESC USER jsmith;
    ```
    The command output is similar to the following:

    ```
    +---------------------+-----------------------------------------------------+---------+----------------------------------------------+
    | property            | value                                               | default | description                                  |
    +---------------------+-----------------------------------------------------+---------+----------------------------------------------+
    | NAME                | JSMITH                                              | null    | Name                                         |
    ...
    ...
    | RSA_PUBLIC_KEY      | MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAslwT... | null    | RSA public key of the user                   |
    | RSA_PUBLIC_KEY_FP   | SHA256:nvnONUsfiuycCLMXIEWG4eTp4FjhVUZQUQbNpbSHXiA= | null    | Fingerprint of user's RSA public key.        |
    | RSA_PUBLIC_KEY_2    | null                                                | null    | Second RSA public key of the user            |
    | RSA_PUBLIC_KEY_2_FP | null                                                | null    | Fingerprint of user's second RSA public key. |
    ...
    +---------------------+-----------------------------------------------------+---------+----------------------------------------------+
    ```
    </dd>
    <dt>Edit the connection configuration file</dt>
    <dd>

    You need to modify [Replicant's connection configuration file for Snowflake](#parameters-related-to-target-snowflake-server-connection) and include RSA key information there. Specifically, add the following parameters to the connection configuration file:

    ```YAML
    private-key-path: "/PATH_TO_GENERATED_KEY/rsa_key.p8"
    private-key-passphrase: "PRIVATE_KEY_PASSPHRASE"
    ```

    Replace the following:

    - *`PATH_TO_GENERATED_KEY`*: the local directory path to the `rsa_key.p8` keyfile
    - *`PRIVATE_KEY_PASSPHRASE`*: the private key passphrase you specified in the [first step](#generate-the-private-key)

    {{< hint "info" >}} If you specify the `private-key-path` and `private-key-passphrase` parameters, you don't need to specify the `password` parameter in the connection configuration file. {{< /hint >}}
    </dd>
    </dl>

    ### Parameters related to stage configuration
    For `COPY` extraction method, you need to specify a stage connection configuration. To specify the stage configuration, use the `stage` field in the connection configuration file. The following configuration options are available:

    <dl class="dl-indent">
    <dt>

    `type`*[v21.06.14.1]*
    </dt>
    <dd>

    The stage type. The following stages are supported:
    <dl class="dl-indent">
    <dt>

    `NATIVE`
    </dt>
    <dd>

    Snowflake's native stage. This stage is created based on table name and job ID. You can specify `CSV` or `PARQUET` as the `file-format`. 
    </dd>
    <dt>
    
    `S3`
    </dt>
    <dd>

    This specifies S3 as the external stage type, allowing Snowflake to export CSV or Parquet files directly to an S3 bucket. 
    
    To be able to connect to the S3 bucket, you need to provide the connection configuration using the `root-dir`, `conn-url`, `key-id`, and `secret-key` paramters. Keep in mind that you need to provide the same stage connection configuration in the target connection configuration file. This allows the Applier to pick up these files directly from S3. 
    
    We recommended S3 stage when both the Extractor and the Applier support S3.
    </dd>
    </dl>
    </dd>
    
    <dt>

    `file-format`
    </dt>
    <dd>

    The file format to use for the exported data. The following file foramts are supported:

    - `CSV`
    - `PARQUET`
    </dd>
    <dt>
    
    `root-dir`
    </dt>
    <dd>

    Specifies a directory on stage that can be used to stage bulk-load files.
    </dd>
    <dt>

    `conn-url` *[v21.06.14.1]*
    </dt>
    <dd>

    Specifies the URL for the stage. For example, for `S3` stage, specify the S3 bucket name.
    </dd>
    <dt>

    `key-id`
    </dt>
    <dd>

    Specifies the access key ID for AWS account hosting S3.  
    </dd>
    <dt>

    `secret-key` *[v21.06.14.1]*
    </dt>
    <dd>

    Specifies the secret access Key for AWS account hosting S3. Applies to `S3` stage type only.
    </dd>
    </dl>

    #### Example configuration for `NATIVE` stage
    ```YAML
    stage:
      type: NATIVE
      file-format: PARQUET
    ```

    #### Example configuration for `S3` stage
    ```YAML
    stage:
      type: S3
      root-dir: "test_snowflake"      
      conn-url: "replicate-stage"     
      key-id: "AKIAIOSFODNN7EXAMPLE"         
      secret-key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"      
      file-format: PARQUET            
    ```

    ### Use RSA key pair for authentication
    You can also choose to use [Snowflake's key pair authentication support](https://docs.snowflake.com/en/user-guide/key-pair-auth.html) for enhanced authentication security instead of using basic authentication via username and password. 
    
    To set up key pair authentication using RSA keys, follow the steps below:

    #### Generate the private key
    From your command line, execute the following command to generate an encrypted private key:

    ```sh
    openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -v1 PBE-SHA1-RC4-128 -out rsa_key.p8
    ```
    The command generates a private key in PEM format:

    ```
    -----BEGIN ENCRYPTED PRIVATE KEY-----
    MIIFHDBOBgkqhkiG9w0BBQ0wQTApBgkqhkiG9w0BBQwwHAQIK0h8dqI1n5sCAggA
    MAwGCCqGSIb3DQIJBQAwFAYIKoZIhvcNAwcECNDwqMf6Xx1pBIIEyNmf044S+pEQ
    ...
    -----END ENCRYPTED PRIVATE KEY-----
    ```
    {{< hint "info" >}}
  **Important:** The command above to generate an encrypted key prompts for a passphrase to grant access to the key. We recommend using a passphrase that complies with PCI DSS standards to protect the generated private key. Additionally, we recommend storing the passphrase in a secure location. When using an encrypted key to connect to Snowflake, you will need to input the passphrase during the initial connection. The use of the passphrase is only for protecting the private key; it's never to sent to Snowflake servers.

  To generate a long and complex passphrase based on PCI DSS standards, follow the steps below:

  - Go to the [PCI Security Standards Document Library](https://www.pcisecuritystandards.org/document_library).
  - For **PCI DSS**, select the most recent version and your desired language.
  - Complete the form to access the document.
  - Search for `Passwords/passphrases must meet the following:` and follow the recommendations for password/passphrase requirements, testing, and guidance.
    {{< /hint >}}

    #### Generate a public key
    From the command line, generate the public key by referencing the private key. The following command references the private key contained in a file named `rsa_key.p8` created in the [previous step](#generate-the-private-key):

    ```sh
    openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
    ```
    The command generates a public key in PEM format:

    ```
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAslwTa+Lj5SMI58GiDzWq
    0rwj4FBymfKzHT16RXecnMcx7uI6KsVpqfh9HH0FMb/3C6YEMeGPkaRmKvXYjM5s
    ...
    -----END PUBLIC KEY-----
    ```

    #### Store the Private and Public Keys Securely

    After following the above steps, you should find the private and public key files saved in a local directory of your system. Note down the path to those files. The private key is stored using the PKCS#8 (Public Key Cryptography Standards) format and is encrypted using the passphrase you specified in the [first step](#generate-the-private-key).

    However, maintain caution in protecting the file from unauthorized access using the file permission mechanism provided by your operating system. It's your responsibility to secure the file when it's not being used.

    #### Assign the public key to a Snowflake user
    Execute the following command to assign the public key to a Snowflake user.

    ```sql
    alter user jsmith set rsa_public_key='MIIBIjANBgkqh...';
    ```

    {{< hint "info" >}}
  - Only security administrators (i.e. users with the SECURITYADMIN role) or higher can alter a user.
  - Exclude the public key delimiters in the SQL statement.
    {{< /hint >}}


    #### Verify the user's public key fingerprint
    Execute the following command to verify the user’s public key:

    ```sql
    DESC USER jsmith;
    ```
    The command output is similar to the following:

    ```
    +---------------------+-----------------------------------------------------+---------+----------------------------------------------+
    | property            | value                                               | default | description                                  |
    +---------------------+-----------------------------------------------------+---------+----------------------------------------------+
    | NAME                | JSMITH                                              | null    | Name                                         |
    ...
    ...
    | RSA_PUBLIC_KEY      | MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAslwT... | null    | RSA public key of the user                   |
    | RSA_PUBLIC_KEY_FP   | SHA256:nvnONUsfiuycCLMXIEWG4eTp4FjhVUZQUQbNpbSHXiA= | null    | Fingerprint of user's RSA public key.        |
    | RSA_PUBLIC_KEY_2    | null                                                | null    | Second RSA public key of the user            |
    | RSA_PUBLIC_KEY_2_FP | null                                                | null    | Fingerprint of user's second RSA public key. |
    ...
    +---------------------+-----------------------------------------------------+---------+----------------------------------------------+
    ```

    #### Edit the connection configuration file
    You need to modify [Replicant's connection configuration file for Snowflake](#parameters-related-to-target-snowflake-server-connection) and include RSA key information there. Specifically, add the following parameters to the connection configuration file:

    ```YAML
    private-key-path: "/PATH_TO_GENERATED_KEY/rsa_key.p8"
    private-key-passphrase: "PRIVATE_KEY_PASSPHRASE"
    ```

    Replace the following:

    - *`PATH_TO_GENERATED_KEY`*: the local directory path to the `rsa_key.p8` keyfile
    - *`PRIVATE_KEY_PASSPHRASE`*: the private key passphrase you specified in the [first step](#generate-the-private-key)

    {{< hint "info" >}} If you specify the `private-key-path` and `private-key-passphrase` parameters, you don't need to specify the `password` parameter in the connection configuration file. {{< /hint >}}

## II. Set up Extractor configuration
To configure replication mode according to your requirements, specify your configuration in the Extractor configuration file. You can find a sample Extractor configuration file `snowflake.yaml` in the `$REPLICANT_HOME/conf/src` directory. For example:

### Configure `snapshot` replication
Snowflake supports two types of extraction method:

- **`QUERY`**: The default JDBC-based extraction method.
- **`COPY`**: The file-based extraction method that uses Snowflake's native export capability. For more information, see the following section.

#### Native export
Arcion Replicant supports exporting Snowflake data into CSV or Parquet files. You can store these files locally or in a remote directory like an S3 bucket. This feature is currently supported in `snapshot` mode.

To enable native export, follow these steps:

<dl class="dl-indent">
<dt>1. Set the extraction method and options in the Extractor configuration file</dt>
<dd>

- Set the `extraction-method` parameter to `COPY` in the Extractor configuration file. This enables Snowflake native export by using the `COPY` command to export data. 

  Extraction method defaults to `QUERY` and native export is disabled.

- Set the `native-extract-options` options in the Extractor configuration file. 
  
  This configuration only applies when you use CSV as the file format for Snowflake native export. This allows you to tune parameters such as the compression type, control characters, delimiter, escape character, and line ending. Make sure to specify similar configurations in the [Applier `bulk-load`]({{< ref "docs/targets/configuration-files/applier-reference#bulk-load" >}}) parameter to avoid compatibility issues.

You can specify these options both globally and for [specific tables]({{< ref "docs/sources/configuration-files/extractor-reference#per-table-config" >}}).
</dd>

<dt>2. Specify stage configuration in the connection configuration file</dt>
<dd>

Snowflake dumps extracted files into a stage in CSV or Parquet format. To specify the stage configuration, see [Parameters related to stage configuration](#parameters-related-to-stage-configuration).
</dd>
</dl>

#### Sample `snapshot` mode configuration

{{< details title="With native export disabled" open=false >}}
```YAML
snapshot:
  threads: 32
  fetch-size-rows: 100000
  min-job-size-rows: 1000000
  max-jobs-per-chunk: 32
  _traceDBTasks : true

  per-table-config:
    - catalog: DEMO_DB
      schema: tpch
      tables:
        CUSTOMER:
          num-jobs: 32
          split-key: C_CUSTKEY
          row-identifier-key: [ C_CUSTKEY ]
        ORDERS:
          num-jobs: 32
          split-key: O_ORDERKEY
          row-identifier-key: [ O_ORDERKEY ]
        split-hints:
          row-count-estimate: 15000
```
{{< /details >}}
{{< details title="With native export enabled" open=false >}}
```YAML
snapshot:
  threads: 32
  fetch-size-rows: 100000
  min-job-size-rows: 1000000
  max-jobs-per-chunk: 32
  _traceDBTasks : true

  extraction-method: COPY    

  native-extract-options:
    compression-type: "GZIP"
    control-chars:
      delimiter: ','
      escape: "\\"
      line-end: "\n"
```
{{< /details >}}
For more information about the configuration parameters for `snapshot` mode, see [Snapshot mode]({{< ref "docs/sources/configuration-files/extractor-reference#snapshot-mode" >}}).

### Configure `realtime` replication
#### Sample `realtime` mode configuration

```YAML
realtime:
  threads: 32
  fetch-size-rows: 100000
  _traceDBTasks: true
  fetch-interval-s: 0
```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "docs/sources/configuration-files/extractor-reference#realtime-mode" >}}).