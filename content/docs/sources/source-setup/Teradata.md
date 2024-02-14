---
pageTitle: Teradata Source Connector Documentation
title: Teradata
description: "Step-by-step guide on how to mobilize data from Teradata"
url: docs/source-setup/teradata
bookHidden: false
---

# Source Teradata

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:

   ```BASH
   vi conf/conn/teradata.yaml
   ```

    To connect to Teradata, Arcion provides two methods for an authenticated connection:
    - [Connect with TLS connection](#tabs-username-pwd-tls-method-0)
    - [Connect without TLS connection](#tabs-username-pwd-tls-method-1)
2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 

  {{< tabs "username-pwd-tls-method" >}}
  {{< tab "Connect with TLS connection" >}}

   ```YAML
   type: TERADATA

   #url: jdbc:teradata://<ip-address>/HTTPS_PORT=<port>,ENCRYPTDATA=ON,TYPE=FASTEXPORT,USER=<username>,PASSWORD=<password>
   host: <ip-address>
   port: <port>
   #client-charset: UTF8

   username: <username>
   password: <password>

   #credential-store:
   #  type: PKCS12
   #  path: #Location of key-store
   #  key-prefix: "teradata_"
   #  password: #If password to key-store is not provided then default password will be used
   ssl:
     enable: true
     ssl-mode: PREFER #Allowed values are {DISABLE/ALLOW/PREFER/REQUIRE/VERIFY-CA/VERIFY-FULL}. By default, PREFER.

    # Details of file that contains trusted database server certificates and/or Certificate Authority (CA) certificates
    # for use with SSLMODE=VERIFY-CA or VERIFY-FULL
     trust-store:
       path: '<trustStore_directory_path>'
       password: '<truststore_password>'
       ssl-store-type: '<truststore_type>'

    # File/Folder path of a PEM file(s) that contains Certificate Authority (CA) certificates for
    # use with SSLMODE=VERIFY-CA or VERIFY-FULL.
     ssl-cert: <CA_Certs_directory_or_file_path>

   tpt-connection: #Connection configuration for TPT jobs
     host: <ip-address> #Teradata host name
     username: <username> #Teradata server username
     password: <password>
       #credential-store:
       #  type: PKCS12
       #  path: #path to your keystore file
       #  key-prefix: # prefix of the keystore entry
       #  password: # optional, keystore password
     #use-ldap: true  #Whether TPT should use LDAP mechanism to connect to TD
     #max-sessions: 16  #Max sessions per TPT job
     #min-sessions: 1 #Min sessions per TPT job
     #tenacity-hrs: 1 #Number of hours TPT continues trying logon
     #tenacity-sleep-mins: 1 #Sleep duration before each retry


   max-connections: 30 # Maximum number of connections replicant would use to fetch data from source Teradata.

   max-retries: 10 
   retry-wait-duration-ms: 1000

   max-conn-retries: #Number of times any operation on the source system will be re-attempted on failures.
   conn-retry-wait-duration-ms: 5000 #Duration in milliseconds Replicant should wait before performing then next retry of a failed operation
   ```
   - **ssl-mode**: Teradata supports multiple `SSLMODE` which specifies the mode for connecting to the database as per below:
      - `ssl-mode: PREFER` uses HTTPS/TLS connections unless the database does not offer HTTPS/TLS connections or Java does not have TLSv1.2. It is the default config.
      - `ssl-mode: REQUIRE` uses HTTPS/TLS connections.
      - `ssl-mode: VERIFY-CA` uses HTTPS/TLS connections and verifies that the server certificate is valid and trusted.
      - `ssl-mode: VERIFY-FULL` uses HTTPS/TLS connections, verifies that the server certificate is valid and trusted, and verifies that the server certificate matches the database hostname.

  - **trust-store**:
      - `path`: Specifies the file name of a Java TrustStore file that contains trusted database server certificates and/or `Certificate Authority (CA)` certificates for use with `ssl-mode: VERIFY-CA` or `ssl-mode: VERIFY-FULL`.
      - `password`: Specifies the password for the Java TrustStore file identified by the `path` connection parameter. When this parameter is omitted, no password is specified for the Java TrustStore file.
      - `ssl-store-type`: Specifies the type for the Java TrustStore file identified by the `trust-store` connection parameter. When omitted, the Java TrustStore file is assumed to be the Java default TrustStore type.

  - **ssl-cert**: File path/directory path of a PEM file that contains Certificate Authority (CA) certificates for use with `ssl-mode: VERIFY-CA` or `ssl-mode: VERIFY-FULL`.
{{< /tab >}}
{{< tab "Connect without TLS connection" >}}
You can specify your credentials in plain form in the connection configuration file like the folowing sample:


   ```YAML
   type: TERADATA

   #url: jdbc:teradata://<ip-address>/DBS_PORT=<port>,ENCRYPTDATA=ON,TYPE=FASTEXPORT,USER=<username>,PASSWORD=<password>
   host: <ip-address>
   port: <port>
   #client-charset: UTF8

   username: <username>
   password: <password>

   #credential-store:
   #  type: PKCS12
   #  path: #Location of key-store
   #  key-prefix: "teradata_"
   #  password: #If password to key-store is not provided then default password will be used

   tpt-connection: #Connection configuration for TPT jobs
     host: <ip-address> #Teradata host name
     username: <username> #Teradata server username
     password: <password>
       #credential-store:
       #  type: PKCS12
       #  path: #path to your keystore file
       #  key-prefix: # prefix of the keystore entry
       #  password: # optional, keystore password
     #use-ldap: true  #Whether TPT should use LDAP mechanism to connect to TD
     #max-sessions: 16  #Max sessions per TPT job
     #min-sessions: 1 #Min sessions per TPT job
     #tenacity-hrs: 1 #Number of hours TPT continues trying logon
     #tenacity-sleep-mins: 1 #Sleep duration before each retry


   max-connections: 30 # Maximum number of connections replicant would use to fetch data from source Teradata.

   max-retries: 10 
   retry-wait-duration-ms: 1000

   max-conn-retries: #Number of times any operation on the source system will be re-attempted on failures.
   conn-retry-wait-duration-ms: 5000 #Duration in milliseconds Replicant should wait before performing then next retry of a failed operation
   ```
{{< /tab >}}
{{< /tabs>}}

   - **url**: You can directly specify the exact URL that the JDBC driver will use to connect to the source. In that case you don't need to specify the `host`, `port`, `username`, and `password` parameters separately. Instead, embed them within the URL as the example above shows:
   {{< tabs "username-pwd-ssl-method" >}}
  {{< tab "Connect with TLS connection" >}}

   ```YAML
   url: jdbc:teradata://<ip-address>/HTTPS_PORT=<port>,ENCRYPTDATA=ON,TYPE=FASTEXPORT,USER=<username>,PASSWORD=<password
   ```
{{< /tab >}}
{{< tab "Connect without TLS connection" >}}
   ```YAML
   url: jdbc:teradata://<ip-address>/DBS_PORT=<port>,ENCRYPTDATA=ON,TYPE=FASTEXPORT,USER=<username>,PASSWORD=<password>
   ```
{{< /tab >}}
{{< /tabs>}}

   - **client-charset**: Replicant allows users to deal with different character encodings supported by `Teradata` (eg: UTF8, LATIN1_0A, etc.) based on the extraction method used. It offers two extraction methods: 
        - **`QUERY`**: When using `QUERY` extraction method, you have to define the Teradata equivalent Java character set in `client-charset` under connection configuration file which specifies the character encoding to be used by the `JDBC` client. To get the list of the character set mapping, head over to teradata official [docs](https://docs.teradata.com/r/Ge3CNVQsfOeWkiwQv5xfOQ/l~WpcSErb4ZVAyKlJOHzgw). 
        
            For example: If the teradata session character set is `LATIN1_0A` then the value of `client-charset` would be:
        ```YAML
            client-charset: ISO8859_1
        ```

        - **`TPT`**: In case of `TPT` extraction method, define the `charset` parameter under the `native-extract-options` in the extractor configuration [file](#ii-set-up-extractor-configuration). The possible values are `ASCII`, `UTF8` and `UTF16`. 

   - **credential-store**: Replicant supports consuming `username`, `password`, and `url` configurations from a _credentials store_ rather than having users specify them in plain text config file. You can use keystores to store your credentials related to your Teradata server connections and TPT jobs. You should create entries in the credential store for your configs using a prefix and specify the prefix in your config file. For example, you can create keystore entries with aliases `tdserver1_username` and `tdserver1_password`. You can then specify the prefix here as `tdserver1_`.

   {{< hint "info" >}}
   The keystore `password` parameters are optional. If you don't specify the keystore password here, then:
   - For connecting to Teradata server, you must use the UUID from your license file as the keystore password. Remember to keep your license file somewhere safe in order to keep this password secure.
   - For TPT connection, the default password will be used.
   {{< /hint >}}

## II. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the applier configuration file:
   ```BASH
   vi conf/src/teradata.yaml
   ```

2. The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to delta snapshot mode.

    ### Parameters related to snapshot mode
    For snapshot mode, make the necessary changes in the `snapshot` section of the configuration file. The following is a working sample:

    ```YAML
    snapshot:
      threads: 32
      fetch-size-rows: 10_000

      min-job-size-rows: 1_000_000
      max-jobs-per-chunk: 32
      verifyRowCount: false
      _traceDBTasks: true

      split-method: RANGE  # Allowed values are RANGE, MODULO
      extraction-method: QUERY # Allowed values are QUERY, TPT
      tpt-num-files-per-job: 16
      native-extract-options:
        charset: "ASCII"  #Allowed values are ASCII, UTF8 and UTF16
        compression-type: "GZIP" #Allowed values are GZIP and NONE
    ```
    You can also configure your table-specific requirements under the `per-table-config` section like the following:

    ```YAML
    per-table-config:
    - schema: tpch
      tables:
        testTable
          split-key: split-key-column
        part:
          split-key: partkey
        partsupp:
          split-key: partkey
        supplier:
        orders:
          split-key: orderkey
          split-method: RANGE      #Table level overridable config, allowed values : RANGE, MODULO
          extraction-method: TPT   # Allowed values are QUERY, TPT
          tpt-num-files-per-job: 16
          extraction-priority: 2  #Higher value is higher priority. Both positive and negative values are allowed. Default priority is 0 if unspecified.
          split-hints:
            row-count-estimate: 15000
            split-key-min-value: 1
            split-key-max-value: 60_000
          native-extract-options:
            charset: "ASCII"  #Allowed values are ASCII, UTF8 and UTF16
            column-size-map:  #User specified column size/length to be used while exporting with TPT
              "COL1": 2
              "COL2": 4
              "COL3": 3
            compression-type: "GZIP"
    ```

    ### Parameters related to delta snapshot mode
    For delta snapshot mode, make the necessary changes in the `delta-snapshot` section of the configuration file like the following:

    ```YAML
    delta-snapshot:
      threads: 32
      fetch-size-rows: 10_000

      min-job-size-rows: 1_000_000
      max-jobs-per-chunk: 32
      _max-delete-jobs-per-chunk: 32

      split-method: RANGE  # Allowed values are RANGE, MODULO
      extraction-method: QUERY # Allowed values are QUERY, TPT
      tpt-num-files-per-job: 16
      native-extract-options:
        charset: "ASCII"  #Allowed values are ASCII, UTF8 and UTF16
        compression-type: "GZIP"

      split-key: last_update_time
      delta-snapshot-key: last_update_time
      delta-snapshot-interval: 10
      delta-snapshot-delete-interval: 10
      _traceDBTasks: true
      replicate-deletes: false
    ```
    You can also configure your table-specific requirements under the `per-table-config` section like the following:

    ```YAML
    per-table-config:
    - schema: tpch
      tables:
       testTable
          split-key: split-key-column  # Any numeric/timestamp column with sufficiently large number of distincts
          extraction-method: TPT
          native-extract-options:
            charset: "ASCII" #Allowed values are ASCII, UTF8 and UTF16
            compression-type: "GZIP"
            control-chars:
              delimiter: '~'
              quote: '"'
              # If extraction method is TPT, delimiter in a string is escaped using the provided escape char.
              # https://docs.teradata.com/r/Teradata-Parallel-Transporter-Reference/July-2017/DataConnector-Operator/
              # Usage-Notes/TextDelimiter-and-EscapeTextDelimiter
              escape: "\\"
              line-end: "\n"
              # If multi-char-delimiter is provided, it will have higher precedence than delimiter.
              # Applicable only if extraction method is TPT.
              multi-char-delimiter: "|~|"
    ```

    {{< hint "warning" >}}
  **Important:** When using `TPT` as the `extraction-method`, _do not_ specify the `null-string` parameter under the `control-chars` section. Notice the preceding sample for context. This is necessary because Teradata generates empty strings for both null and empty strings by default in TPT extracted CSV files. According to what the target supports, Replicant tries to convert these empty strings into appropriate null values.
    {{< /hint >}}

For a detailed explanation of configuration parameters in the extractor file, read [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").
