---
pageTitle: Documentation for snapshot replication from SQL Server
title: "Delta-snapshot replication"
description: "Set up IBM Db2 as data Source using Arcion Db2 connector. Arcion supports Db2 on Kafka/MQ, Native LUW, and i Series AS/400 platforms."
bookHidden: false
weight: 2
url: docs/source-setup/sqlserver/delta-snapshot-replication
---

# Delta-snapshot replication from SQL Server
Delta-snapshot is a recurring snapshot replication. In delta-snapshot, Replicant replicates the delta (difference) of the records that have been inserted or updated since the previous delta-snapshot iteration. Replicant uses the delta-snapshot key column and the recovery table to identify the set of delta records that have changed since the previous delta-snapshot iteration. The change can result from insert, update, or delete operations.

You can enable delta-snapshot replication by running Replicant with the `delta-snapshot` option. For more information, see [Replicant delta-snapshot mode]({{< ref "docs/running-replicant#replicant-delta-snapshot-mode" >}}).

Follow the steps in the following sections to set up SQL Server for `delta-snapshot` mode replication. In these steps, `$REPLICANT_HOME` refers to [your Arcion Self-hosted CLI download directory]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}).

## I. Required Permissions

To allow replication, you need to first verify that the necessary permissions are in place on source SQL Server. For more information, see [SQL Server User Permissions]({{< relref "../../source-prerequisites/sqlserver#sql-server-user-permissions" >}}).

## II. Set up connection configuration
Specify the connection details of your SQL Server instance to Replicant in one of the following ways:

- [A connection configuration file](#using-a-connection-configuration-file)
- [Secrets management service](#use-a-secrets-management-service)
- [KeyStore](#using-keystore-for-credentials)

### Using a connection configuration file.
The connection configuration fild holds the connection details and login credentials.
You can find a sample connection configuration file `sqlserver.yaml` in the `$REPLICANT_HOME/conf/conn` directory. The following configuration parameters are available:

#### `type`
The connection type representing the database. In this case, it's `SQLSERVER`.

#### `host`
The hostname of your SQL Server system.

#### `port`
The port number to connect to the `host`.

#### `username`
The username credential to access the SQL Server system.

#### `password`
The password associated with `username`.

#### `auth-type`
The authentication protocol for the connection. The following protocols are supported:

- `NATIVE` (Default)
- `NLTM`
    
Default authentication protocol is always `NATIVE` if you don't explicitly set the `auth-type` parameter.

In case of `NLTM` protocol, provide the [`username`](#username) in `DOMAIN\USER` format—for example, `domain\alex`.

#### `is_azure`
Optional parameter. If you're hosting SQL Server on Azure, you must set this parameter to `true`.

#### `max-connections` 
The maximum number of connections Replicant uses to load data into the SQL Server system.

The following is a sample connection configuration:


```YAML
type: SQLSERVER

host: localhost
port: 1433

username: 'USERNAME'
password: 'PASSWORD'

max-connections: MAX_NUMBER_OF_CONNECTIONS
```

### Use a secrets management service
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 

### Use KeyStore for credentials
Replicant supports consuming login credentials from a _credentials store_. Instead of specifying username and password [in plain form](#using-a-connection-configuration-file), you can keep them in a KeyStore and provide the KeyStore details in the connection configuration file like below:

```YAML
credential-store:
  type: {PKCS12|JKS|JCEKS}
  path: PATH_TO_KEYSTORE_FILE
  key-prefix: PREFIX_OF_THE_KEYSTORE_ENTRY
  password: KEYSTORE_PASSWORD
```

Replace the following:

- *`PATH_TO_KEYSTORE_FILE`*: The path to your KeyStore file.
- *`PREFIX_OF_THE_KEYSTORE_ENTRY`*: The prefix of your KeyStore entries. You can create entries in the credential store using a prefix that preceeds each credential alias. For example, you can create KeyStore entries with aliases `sqlserver_username` and `sqlserver_password`. You can then set `key-prefix` to `sqlserver_`.
- *`KEYSTORE_PASSWORD`*: The KeyStore password. This parameter is optional. If you don’t want to specify the KeyStore password here, then you must use the UUID from your license file as the KeyStore password. Remember to keep your license file somewhere safe in order to keep the KeyStore password secure.

## III. Set up Extractor configuration
To configure snapshot replication according to your requirements, specify your configuration in the Extractor configuration file. You can find a sample Extractor configuration file `sqlserver.yaml` in the `$REPLICANT_HOME/conf/src` directory. 

All configuration parameters for `delta-snapshot` mode live under the `delta-snapshot` section. The following is a sample configuration:

```YAML
delta-snapshot:
  threads: 32
  fetch-size-rows: 10_000

  min-job-size-rows: 1_000_000
  max-jobs-per-chunk: 32
  _max-delete-jobs-per-chunk: 32

  delta-snapshot-key: col1
  delta-snapshot-interval: 10
  
  per-table-config:
  - catalog: tpch
    schema: public
    tables:
      part:
        delta-snapshot-key: last_update_time
      lineitem:
        delta-snapshot-key: last_update_time
        row-identifier-key: [l_orderkey, l_linenumber]
```

For more information about the configuration parameters in `delta-snapshot` mode, see [Snapshot Mode]({{< ref "../../configuration-files/extractor-reference#snapshot-mode" >}}).