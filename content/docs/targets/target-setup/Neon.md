---
pageTitle: Neon target connector
title: Neon
description: "Neon is a fully managed serverless PostgreSQL database. Learn how to use Arcion to ingest data in real time into Neon."
url: docs/target-setup/neon
bookHidden: false
---
# Destination Neon

This page describes how to use Arcion to load data in real time into Neon, a fully managed serverless PostgreSQL database.

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) download as the `$REPLICANT_HOME` directory.

## Prerequisites
- [Create a Neon account.](https://neon.tech/docs/get-started-with-neon/signing-up)
- [Create your project.](https://neon.tech/docs/get-started-with-neon/setting-up-a-project)
- After creating a project, the **Connection details for your new project** dialog shows the connection details to connect to the default `neondb` database.
  
## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample Neon connection configuration file:
    ```BASH
    vi conf/conn/neon_dst.yaml
    ```
2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: POSTGRESQL

    host: host.aws.neon.tech #Replace host.aws.neon.tech with your Neon host
    port: 5432  #Replace the 57565 with the port of your host

    database: 'neondb' #Replace neondb with your database name, default is neondb
    username: 'replicant' #Replace replicant with the username of your user that connects to your Neon server
    password: 'Replicant#123' #Replace Replicant#123 with your user's password

    ssl: #Neon requires an SSL connection, so we need to enable it.
      enable: true
      hostname-verification: false

    max-connections: 30 #Specify the maximum number of connections Replicant can open in Neon
    socket-timeout-s: 60 #The timeout value for socket read operations. The timeout is in seconds and a value of zero means that it is disabled.
    max-retries: 10 #Number of times any operation on the system will be re-attempted on failures.
    retry-wait-duration-ms: 1000 #Duration in milliseconds replicant should wait before performing then next retry of a 
    ```

    {{< hint "warning" >}}
  **Important:** Make sure that the `max_connections` in Neon is greater than the `max-connections` in the preceding connection configuration file.
    {{< /hint >}}

    The `socket-timeout-s` parameter is only supported for versions 22.02.12.16 and newer.

## II. Configure mapper file (optional)
If you want to define data mapping from source to your target Neon, specify the mapping rules in the mapper file. The following is a sample mapper configuration for a **MySQL-to-Neon** pipeline:

```YAML
rules:
  [tpch, public]:
    source:
    - [tpch]
```

For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "../configuration-files/mapper-reference" >}}).

## III. Set up Applier Configuration

1. From `$REPLICANT_HOME`, naviagte to the sample Neon Applier configuration file:
    ```BASH
    vi conf/dst/neon.yaml    
    ```
2. The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to realtime mode.

    ### Parameters related to snapshot mode
    For snapshot mode, below is a sample configuration:

    ```YAML
    snapshot:
      threads: 16
      batch-size-rows: 5_000
      txn-size-rows: 1_000_000
      skip-tables-on-failures: false

      map-bit-to-boolean: false

      bulk-load:
        enable: true
        type: FILE # FILE or PIPE

      _traceDBTasks: true
      use-quoted-identifiers: true
    ```
    
      - `map-bit-to-boolean`: Tells Replicant whether to map `bit(1)` and `varbit(1)` data types from Source to `boolean` on Target:

        - `true`: map `bit(1)`/`varbit(1)` data types from Source to `boolean` on Target Neon
        - `false`: map `bit(1)`/`varbit(1)` data types from Source to `bit(1)`/`varbit(1)` on Target Neon

        *Default: `false`.*

    ### Parameters related to realtime mode
    If you want to operate in realtime mode, you can use the `realtime` section to specify your configuration. For example:

    ```YAML
    realtime:
      threads: 8
      txn-size-rows: 10000
      batch-size-rows: 1000
      skip-tables-on-failures : false

      use-quoted-identifiers: true
    ```
    
For a detailed explanation of configuration parameters in the applier file, see [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").