---
pageTitle: Use SQL Server change tracking for real-time replication
title: "Change tracking"
description: "Use SQL Server Change Tracking as CDC Extractor to replicate data in realtime from Microsoft SQL Server."
weight: 1
url: docs/source-setup/sqlserver/realtime-replication/change-tracking
---

# Real-time replication from SQL Server with change tracking
For real-time replicaiton from SQL Server, you can choose SQL Server Change Tracking as a CDC Extractor. Follow these steps to set up real-time replication using change tracking.

## I. Prerequisites
### Required Permissions
To allow replication, you need to first verify that the necessary permissions are in place on source SQL Server. For more information, see [SQL Server User Permissions]({{< relref "../../../source-prerequisites/sqlserver#sql-server-user-permissions" >}}).

### Primary keys on tables
For [full mode replication]({{< relref "../full-mode-replication" >}}) with change tracking, make sure that all the tables that you need to replicate have primary keys.

## II. Set up connection configuration
Specify the connection details of your SQL Server instance to Replicant in one of the following ways:

- [A connection configuration file](#using-a-connection-configuration-file)
- [Secrets management service](#use-a-secrets-management-service)
- [KeyStore](#using-keystore-for-credentials)

### Use a connection configuration file
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

#### `extractor`
The CDC Extractor to use for real-time replication. 

To use SQL Server Change Tracking, follow these steps:

- Set `extractor` to `CHANGE`.
- Follow the instructions in [Enable change tracking](#enable-change-tracking).

#### `is_azure`
Optional parameter. If you're hosting SQL Server on Azure, you must set this parameter to `true`.

#### `max-connections` 
The maximum number of connections Replicant uses to load data into the SQL Server system.

The following is a sample connection configuration:


```YAML
type: SQLSERVER

host: localhost
port: 1433

username: 'alex'
password: 'alex1995'

extractor: CHANGE

max-connections: 30
```

### Use a secrets management service
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 

### Use KeyStore for credentials
Replicant supports consuming login credentials from a _credentials store_. Instead of specifying username and password [in plain text](#use-a-connection-configuration-file), you can keep them in a KeyStore and provide the KeyStore details in the connection configuration file like below:

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

All configuration parameters for `realtime` mode live under the `realtime` section. The following is a sample configuration:

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

For more information about the configuration parameters in `realtime` mode, see [Realtime Mode]({{< ref "../../../configuration-files/extractor-reference#realtime-mode" >}}).

## Enable change tracking
To use change tracking, you must enable change tracking in all databases and tables:

1.  Enable change tracking in database:
  

    ```SQL
    ALTER DATABASE database_name SET CHANGE_TRACKING = ON  
    (CHANGE_RETENTION = 2 DAYS, AUTO_CLEANUP = ON)
    ```
    Replace *`database_name`* with the name of the database you want to enable change tracking on.

2. Enable change tracking on table:

    ```SQL
    ALTER TABLE table_name ENABLE CHANGE_TRACKING
    ```
    Replace *`table_name`* with the name of the table you want to enable change tracking on.