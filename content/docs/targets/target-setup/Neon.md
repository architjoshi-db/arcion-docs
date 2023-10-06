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
To connect to Neon, you have these two options:
{{< tabs "neon-connection" >}}
{{< tab "Use a connection configuration file" >}}
You can specify your connection details to Replicant with a YAML connection configuration file. You can find a sample connection configuration file `neon_dst.yaml` in the `$REPLICANT_HOME/conf/conn` directory. For example:

```YAML
type: POSTGRESQL

host: HOSTNAME
port: PORT_NUMBER

database: 'DATABASE_NAME'
username: 'USERNAME'
password: 'PASSWORD'

ssl:
  enable: true
  hostname-verification: false

max-connections: 30 
socket-timeout-s: 60
max-retries: 10 
retry-wait-duration-ms: 1000
```

Replace the following:

- *`HOSTNAME`*: your Neon hostname—for example, `ep-cool-darkness-123456.us-east-2.aws.neon.tech`.
- *`PORT_NUMBER`*: the port number. Neon uses the default PostgreSQL port `5432`.
- *`DATABASE_NAME`*: the Neon database name. Default database name is `neondb`.
- *`USERNAME`*: the username of the user that connects to Neon.
- *`PASSWORD`*: the password associated with *`USERNAME`*.

Feel free to change the following parameter values as you need:

- *`max-connections`*: the maximum number of connections Replicant opens in Neon.
- *`max-retries`*: number of times Replicant retries a failed operation.
- *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
- *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads. This parameter is only supported for Arcion self-hosted CLI versions 22.02.12.16 and newer.
{{< /tab >}}

{{< tab "Use a secrets management service" >}}
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}).
{{< /tab>}}
{{< /tabs >}}
    

{{< hint "warning" >}}
**Important:** 
- Make sure that the [`max_connections` number in Neon](https://neon.tech/docs/connect/connection-pooling#default-connection-limits) exceeds the `max-connections` number in the preceding connection configuration file.
- Neon requires an SSL connection. Therefore, you must enable SSL by defining the `ssl` parameter in the connection configuration file.
{{< /hint >}}

## II. Configure mapper file (optional)
If you want to define data mapping from source to your target Neon, specify the mapping rules in the mapper file. The following is a sample mapper configuration for a **MySQL-to-Neon** pipeline:

```YAML
rules:
  [tpch, public]:
    source:
    - [tpch]
```

For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "../configuration-files/mapper-reference" >}}).

## III. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `neon.yaml` in the `$REPLICANT_HOME/conf/dst` directory. For example:

You can configure Neon for operating in either [snapshot](#configure-snapshot-mode) or [realtime](#configure-realtime-mode) mode.


### Configure `snapshot` mode
For operating in [snapshot mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the conifiguration file. For example:

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

#### Additional `snapshot` parameters

`map-bit-to-boolean` 
: Tells Replicant whether to map `bit(1)` and `varbit(1)` data types from source to `boolean` on target.


  If `true`, Replicant maps `bit(1)`/`varbit(1)` data types from source to `boolean` on target Neon. If `false`, Replicant maps `bit(1)`/`varbit(1)` data types from source to `bit(1)`/`varbit(1)` on target Neon.

  *Default: `false`.*

For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure `realtime` mode
If you want to operate in [real time]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}), use the `realtime` section to specify your configuration. For example:

```YAML
realtime:
  threads: 8
  txn-size-rows: 10000
  batch-size-rows: 1000
  skip-tables-on-failures : false

  use-quoted-identifiers: true
```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "../configuration-files/applier-reference#realtime-mode" >}}).
