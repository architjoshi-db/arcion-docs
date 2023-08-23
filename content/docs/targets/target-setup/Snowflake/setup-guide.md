---
pageTitle: Documentation for Snowflake Target connector
title: Setup guide
description: "Set up Snowflake target for snapshot and realtime replication. We discuss RSA authentication, clustering tables support, and more."
bookHidden: false
weight: 1
url: docs/target-setup/snowflake/setup-guide
---

# Destination Snowflake setup guide

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## Required permissions
- Make sure the user possesses the following privileges on the catalogs or schemas where you want Replicant to replicate tables to: 
  - `CREATE TABLE`
  - `CREATE STAGE`
- To create catalogs or schemas on the target Snowflake system, you must grant `CREATE DATABASE` or `CREATE SCHEMA` privileges respectively to the user.
- If the user does not possess `CREATE DATABASE` privilege, then follow these steps:
    1. Create a database manually with the name `blitzz`.
    2. Grant all privileges for the `blitzz` database to that user.
  
  Replicant uses this `io` database to maintain internal checkpoint and metadata.

## I. Set up connection configuration

1. From `$REPLICANT_HOME`, navigate to the sample Snowflake connection configuration file:
    ```BASH
    vi conf/conn/snowlflake.yaml
    ```
2. The configuration file contains two parts:

    - Parameters to configure target Snowflake server connection.
    - Parameters to configure stage.

    ### Parameters to configure target Snowflake server connection
    {{< hint "info" >}}
  **Note:** All communications with Snowflake happens through port 443, the standard port for HTTPS. So all data is encrypted and secure with SSL by default.
    {{< /hint >}}
    For connecting to target Snowflake server, you can choose between two methods for an authenticated connection: 
    - [RSA key pair authentication](#use-rsa-key-pair-for-authentication)
    - Basic username and password authentication

    To connect to Snowflake with basic username and password authentication, you have two options:

    #### Fetch credentials from AWS Secrets Manager
    You can choose to store your username and password in AWS Secrets Manager, and tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}).

    #### Specify credentials in plain form
    You can also specify your credentials in plain form in the connection configuration file like the following sample:

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

    ### Additional parameters
    #### `credential-store`
    Replicant supports consuming `username` and `password` configurations from a _credentials store_ rather than having users specify them in plain text configuration file. You can use KeyStores to store your credentials for Snowflake server connections. `credential-store` supports the following parameters to configure credentials store:
    <dl class="dl-indent">
    <dt>
    
    `type`</dt>
    <dd>
    
    Type of the KeyStore. 
    
    Arcion supports the following types:
    - `PKCS12`
    - `JKS`
    - `JCEKS`. 
    </dd>
    
    <dt>
    
    `path`</dt>
    <dd>
    
    Location of the KeyStore. </dd>
    <dt>
    
    `key-prefix`</dt>
    <dd>
    
    You must create entries in the credential store for your configs using a prefix and specify the prefix here. For example, if you create KeyStore entries with aliases `snowflake1_username` and `snowflake1_password`, you can then specify the prefix here as `snowflake1_`. </dd>
    
    <dt>
    
    `password`</dt>
    <dd>
    
    Optional field. 
    
    If you don't specify the KeyStore password here, then you must use the UUID from your license file as the KeyStore password. Remember to keep your license file somewhere safe in order to keep this password secure.</dd>
    </dl>

    ### Parameters related to stage configuration
    Stage configuration allows you to tune native or external staging area for bulk loading. For more information, see [Stage configuration]({{< relref "stage-configuration" >}}).

    ### Use RSA key pair for authentication
    You can also choose to use [Snowflake's key pair authentication support](https://docs.snowflake.com/en/user-guide/key-pair-auth.html) for enhanced authentication security instead of using basic authentication via username and password. 
    
    To set up key pair authentication using RSA keys, follow these steps:

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
  **Important:** The preceding command to generate an encrypted key prompts for a passphrase to grant access to the key. We recommend using a passphrase that complies with PCI DSS standards to protect the generated private key. We also recommend storing the passphrase in a secure location. When using an encrypted key to connect to Snowflake, you need to input the passphrase during the initial connection. The passphrase only protects the private key and never reaches Snowflake servers.

  To generate a long and complex passphrase based on PCI DSS standards, follow these steps:

  - Go to the [PCI Security Standards Document Library](https://www.pcisecuritystandards.org/document_library).
  - For **PCI DSS**, select the most recent version and your desired language.
  - Complete the form to access the document.
  - Search for `Passwords/passphrases must meet the following:` and follow the recommendations for password/passphrase requirements, testing, and guidance.
    {{< /hint >}}

    #### Generate a public key
    From the command line, generate the public key by referencing the private key. The following command references the private key from a file `rsa_key.p8` that you create in the [previous step](#generate-the-private-key):

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

    #### Store the private and public keys securely

    After following the preceding steps, the private and public key files are saved in a local directory of your system. Note down the path to those files. The private key is stored using the PKCS#8 (Public Key Cryptography Standards) format and is encrypted using the passphrase you specified in the [first step](#generate-the-private-key).

    However, maintain caution in protecting the file from unauthorized access using the file permission mechanism your operating system provides. You must take responsibility to secure the file when not in use.

    #### Assign the public key to a Snowflake user
    Execute the following command to assign the public key to a Snowflake user.

    ```sql
    alter user jsmith set rsa_public_key='MIIBIjANBgkqh...';
    ```

    {{< hint "info" >}}
  - Only security administrators, for example, users with the SECURITYADMIN role or higher, can alter a user.
  - Exclude the public key delimiters in the SQL statement.
    {{< /hint >}}


    #### Verify the user's public key fingerprint
    Execute the following command to verify the user’s public key:

    ```sql
    DESC USER jsmith;
    ```
    The command output resembles the following:

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
    You need to modify [Replicant's connection configuration file for Snowflake](#parameters-to-configure-target-snowflake-server-connection) and include RSA key information there. Specifically, add the following parameters to the connection configuration file:

    ```YAML
    private-key-path: "/PATH_TO_GENERATED_KEY/rsa_key.p8"
    private-key-passphrase: "PRIVATE_KEY_PASSPHRASE"
    ```

    Replace the following:

    - *`PATH_TO_GENERATED_KEY`*: the local directory path to the `rsa_key.p8` keyfile
    - *`PRIVATE_KEY_PASSPHRASE`*: the private key passphrase you in the [first step](#generate-the-private-key)

    {{< hint "info" >}}**Note**: If you specify the `private-key-path` and `private-key-passphrase` parameters, you don't need to specify the `password` parameter in the connection configuration file. {{< /hint >}}

## II. Set up Applier configuration

1. From `$REPLICANT_HOME`, naviagte to the sample Snowflake Applier configuration file:
    ```BASH
    vi conf/dst/snowlflake.yaml        
    ```
2. The configuration file possesses two parts:

    - Parameters to configure snapshot mode.
    - Parameters to configure realtime mode.

    ### Parameters to configure snapshot mode
    For snapshot mode, make the necessary changes as follows:
    ```YAML
    snapshot:
      threads: 16 #Specify the maximum number of threads Replicant should use for writing to the target

      batch-size-rows: 100_000
      txn-size-rows: 1_000_000

      #If bulk-load is used, Replicant will use the native bulk-loading capabilities of the target database
      bulk-load:
        enable: true|false #Set to true if you want to enable bulk loading
        type: FILE|PIPE #Specify the type of bulk loading between FILE and PIPE
        serialize: true|false #Set to true if you want the generated files to be applied in serial/parallel fashion

        #For versions 20.09.14.3 and beyond
        native-load-configs: #Specify the user-provided LOAD configuration string which will be appended to the s3 specific LOAD SQL command
    ```
    #### Enable clustering
    To improve performance, primary keys and unique keys need to be clustering keys on Snowflake side.
    Replicant achieves that by making primary and unique keys as clustering keys when Replicant creates the tables.

    To enable clustered table creation, set the `force-use-clustered-key` parameter to `true` in your Applier configuration file. `for-use-clustered-key` defaults to `false` and Snowflake tables don't have clustering keys designated to them.

    {{< hint "warning" >}}
  **Important:** You must run Replicant with the `--replace` option for clustering to work.
    {{< /hint >}}

    For more information on Snowflake clustering, see [Clustering Keys & Clustered Tables](https://docs.snowflake.com/en/user-guide/tables-clustering-keys.html).
    ### Parameters related to realtime mode
    To operate in realtime mode, use the `realtime` section to specify your configuration. For example:

    ```YAML
    realtime:
      threads: 8 #Specify the maximum number of threads Replicant should use for writing to the target
      max-retries-per-op: 30 #Specify the maximum amount of retries for a failed operation
      retry-wait-duration-ms: 5000 #Specify the time in milliseconds Replicant should wait before re-trying a failed operation
      cdc-stage-type: FILE #Enter your cdc-stage-type
    ```

    When operating in realtime mode, pay attention to the following details:

    - Make sure that the number of `threads` equals the number of tables.
    - Enable PK or UK logging if source table has PK or UK. If table does not possess any PK, then only enable full logging. For example, if you load data from Oracle, Oracle supports UK logging.
    - You might want to select any table in your Snowflake dashboard while operating. Due to a Snowflake limitation, problems may arise if table name contains lowercase. Therefore, you need to execute the following command first:
      ```SQL
      ALTER SESSION SET QUOTED_IDENTIFIERS_IGNORE_CASE = FALSE;
      ```
      After executing the preceding command, you can select table with lowercase names by surrounding the names with double quotation marks.

    ### Enable Type-2 CDC
    From version 22.07.19.3 onwards, Arcion supports Type-2 CDC for Snowflake as the target. For more information, see [Type-2 CDC]({{< ref "docs/references/type-2-cdc" >}}) and [`cdc-metadata-type`]({{< relref "../../configuration-files/applier-reference#cdc-metadata-type" >}}).

    

