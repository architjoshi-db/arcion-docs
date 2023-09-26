---
pageTitle: Documentation for YugabyteSQL Target connector
title: YugabyteSQL
description: "Ingest data into YugabyteSQL in minutes with seamless schema conversion using Arcion Yugabyte connector."
url: docs/target-setup/yugabyte_sql
bookHidden: false
---
# Destination YugabyteSQL

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up connection configuration

1. From `$REPLICANT_HOME`, navigate to the sample YugabyteSQL connection configuration file:
    ```BASH
    vi conf/conn/yugabytesql.yaml
    ```
2. If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: YUGABYTESQL

    host: HOSTNAME
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

- *`HOSTNAME`*: the hostname of the YugabyteDB cluster.
- *`PORT_NUMBER`*: the port number. Default port is `5433`.
- *`DATABASE_NAME`*: the database name you want to connect to. Default database is `yugabyte`.
- *`USERNAME`*: the username for the user that connects to the `database`. Default username is also `yugabyte`.
- *`PASSWORD`*: the password associated with *`USERNAME`*. Default password is `yugabyte`.

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in YugabyteDB.
- *`max-retries`*: number of times Replicant retries a failed operation.
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads.

For more information on connection credentials in Yugabyte SQL, see [Default user and password](https://docs.yugabyte.com/preview/secure/enable-authentication/ysql/#default-user-and-password).

{{< /tab >}}

{{< tab "Use a secrets management service" >}}
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
{{< /tab >}}
{{< /tabs >}}

### Connect using SSL
To connect to Yugabyte SQL using SSL, follow these steps:

1. Generate server certificates and set up YugabyteDB for encrypted connection by following the instructions in [Create server certificates
](https://docs.yugabyte.com/preview/secure/tls-encryption/server-certificates/).
2. Specify the SSL connection details to Replicant in the connection configuration file in the following format:

    ```YAML
    ssl:
      enable: true
      root-cert: 'PATH_TO_ROOT_CERTIFICATE_FILE'
      hostname-verification: {true|false}
    ```

    Replace *`PATH_TO_ROOT_CERTIFICATE_FILE`* with the location of [the root certificate file](https://docs.yugabyte.com/preview/secure/tls-encryption/server-certificates/#generate-the-root-certificate-file). 
    
    `hostname-verification` enables hostname verification against the server identity according to the specification in the server's certificate. This defaults to `true`.


## II. Configure mapper file (optional)
If you want to define data mapping from source to your target YugabyteSQL, specify the mapping rules in the mapper file. The following is a sample mapper configuration for a **Oracle-to-YugabyteSQL** pipeline:

```YAML
rules:
  [tpch, public]:
    source:
    - "tpch"
convert-case: DEFAULT
```

For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "../configuration-files/mapper-reference" >}}).

## III. Set up Applier configuration

1.  From `$REPLICANT_HOME`, naviagte to the sample YugabyteSQL Applier configuration file:

    ```BASH
    vi conf/dst/yugabytesql.yaml
    ```
2. The file contains the following sample snapshot configuration:

    ```YAML
    snapshot:
     threads: 16

     map-bit-to-boolean: true

     bulk-load:
       enable: true
       type: FILE #FILE or PIPE
       serialize: true

       #For versions 20.09.14.3 and beyond
       native-load-configs: #Specify the user-provided LOAD configuration string which will be appended to the s3 specific LOAD SQL command
    ```

      - `map-bit-to-boolean`: Tells Replicant whether to map `bit(1)` and `varbit(1)` data types from Source to `boolean` on Target:

        - `true`: map `bit(1)`/`varbit(1)` data types from Source to `boolean` on Target Yugabyte
        - `false`: map `bit(1)`/`varbit(1)` data types from Source to `bit(1)`/`varbit(1)` on Target Yugabyte

        *Default: `true`.*

For a detailed explanation of configuration parameters in the Applier file, see [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").
