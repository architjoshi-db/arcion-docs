---
pageTitle: SQL Server native CDC for real-time replication
title: "SQL Server native CDC"
description: "Learn how to use Microsoft SQL Server's native CDC functionality to extract and replicate data in real time."
weight: 3
url: docs/source-setup/sqlserver/realtime-replication/sqlserver-native-cdc
---

# Real-time replication using SQL Server native CDC
For real-time replicaiton from SQL Server, you can choose to use the native CDC functionality of SQL Server to perform data extraction and replication. Follow these steps to set up real-time replication using the SQL Server's native CDC.

## I. Prerequisites
### Required permissions
To allow replication, first verify that the user possesses the necessary permissions on source SQL Server. For more information, see [SQL Server user permissions]({{< relref "../../../source-prerequisites/sqlserver#sql-server-user-permissions" >}}).

### Primary keys on tables
For [full mode replication]({{< relref "../full-mode-replication" >}}) with SQL Server native CDC, make sure that all the tables that you need to replicate have primary keys.

## II. Set up connection configuration
Specify the connection details of your SQL Server instance to Replicant in one of the following two ways:

- [A connection configuration file](#using-a-connection-configuration-file)
- [AWS Secrets Manager](#aws-secrets-manager)
- [KeyStore](#use-keystore-for-credentials)

### Using a connection configuration file.
The connection configuration fild holds the connection details and login credentials.
You can find a sample connection configuration file `sqlserver_src.yaml` in the `$REPLICANT_HOME/conf/conn` directory. The following configuration parameters are available:

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
    
Authentication protocol always defaults to `NATIVE` if you don't explicitly set the `auth-type` parameter.

In case of `NLTM` protocol, provide the [`username`](#username) in `DOMAIN\USER` format—for example, `domain\alex`.

#### `database`
Specify the database name if the source is an Azure SQL Managed Instance.

#### `extractor`
The CDC Extractor to use for real-time replication. 

To use SQL Server's native CDC functionality as the CDC Extractor, set `extractor` to `CDC`.

#### `max-connections` 
The maximum number of connections Replicant uses to load data into the SQL Server system.

The following shows a sample connection configuration:


```YAML
type: SQLSERVER

host: localhost
port: 1433

username: 'alex'
password: 'alex1234'
auth-type: NATIVE
database: 'tpcc'  #set only for managed SQL Azure

extractor: CDC

max-connections: 30
```

### AWS Secrets Manager
If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}). 

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

## III. Create the heartbeat table 
For [`full` mode replication]({{< relref "../full-mode-replication" >}}), you need to create a heartbeat table. For example:

```SQL
CREATE TABLE "tpcc"."dbo"."replicate_io_cdc_heartbeat"("timestamp" BIGINT NOT NULL, PRIMARY KEY("timestamp"))
```

## IV. Set up Extractor configuration
To configure real-time replication according to your requirements, specify your configuration in the Extractor configuration file. You can find a sample `sqlserver.yaml` in the `$REPLICANT_HOME/conf/src` directory. 

All configuration parameters for `realtime` mode live under the `realtime` section. The following shows a sample configuration:

```YAML
realtime:
  threads: 4
  fetch-size-rows: 10000
  fetch-duration-per-extractor-slot-s: 3
  heartbeat:
    enable: true
    catalog: "tpcc"
    schema: "dbo"
    interval-ms: 10000
```

For more information about the configuration parameters in `realtime` mode, see [Realtime mode]({{< ref "../../../configuration-files/extractor-reference#realtime-mode" >}}).