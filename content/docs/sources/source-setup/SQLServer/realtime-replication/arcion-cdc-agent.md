---
pageTitle: Use Arcion CDC Agent for real-time replication
title: "Arcion CDC Agent"
description: "Learn how to set up real-time replication from SQL Server using Arcion CDC Agent that uses efficient and secure CDC technology."
weight: 2
url: docs/source-setup/sqlserver/realtime-replication/arcion-cdc-agent
---

# Real-time replication from SQL Server with Arcion CDC Agent
For real-time replicaiton from SQL Server, you can choose [Arcion CDC Agent]({{< ref "docs/sources/source-prerequisites/sqlserver#replicant-sql-server-agent-installation" >}}) as a CDC Extractor. Follow these steps to set up real-time replication using the Arcion CDC Agent.

## I. Prerequisites
### Required permissions
To allow replication, you need to first verify that the necessary permissions are in place on source SQL Server. For more information, see [SQL Server User Permissions]({{< relref "../../../source-prerequisites/sqlserver#sql-server-user-permissions" >}}).

### Primary keys on tables
For [full mode replication]({{< relref "../full-mode-replication" >}}) with Arcion CDC Agent, we recommend that all the tables that you need to replicate have primary keys. If it's not possible to define primary key on a table, follow the instructions in [Replicate tables without primary keys](#replicate-tables-without-primary-keys).

### Set up Arcion CDC Agent
To set up Arcion CDC Agent, follow the instructions in [Arcion CDC Agent]({{< ref "docs/sources/source-prerequisites/sqlserver#arcion-cdc-agent" >}}).

## II. Set up connection configuration
Specify the connection details of your SQL Server instance to Replicant in one of the following ways:

- [A connection configuration file](#use-a-connection-configuration-file)
- [AWS Secrets Manager](#aws-secrets-manager)
- [KeyStore](#use-keystore-for-credentials)

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

To use Arcion CDC Agent, follow these steps:

1. Set `extractor` to `LOG`.
2. Follow the instructions in [Arcion CDC Agent Installation]({{< ref "docs/sources/source-prerequisites/sqlserver#arcion-cdc-agent-installation" >}}).

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

extractor: LOG

max-connections: MAX_NUMBER_OF_CONNECTIONS
```

#### Configuration user for Arcion CDC Agent
Arcion CDC Agent requires the **sysadmin** role to configure datbase publications and subscriptions that the Agent uses for replication. Therefore, Arcion supports new parameters in the SQL Server connection configuration file from version 23.03.01.10. 

```YAML
config-username: 'sa'
config-password: 'Rocket0128'
config-auth-type: NATIVE
```

The three parameters in the preceding sample describe a _configuration user_. Arcion CDC Agent uses this configuration user to set up replication. You can specify these parameters either [in plain text](#use-a-connection-configuration-file) or [in a KeyStore](#use-keystore-for-credentials).

If you specify `config-username`, Arcion CDC Agent uses this user to set up replication. If you don't specify `config-username`, Arcion CDC Agent uses the [main `username`](#username). 

We recommend that you explicitly specify these three parameters if you're using version 23.03.01.10 and later.

### AWS Secrets Manager
If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}). 

### Use KeyStore for credentials
Replicant supports consuming login credentials from a _credentials store_. Instead of specifying username and password [in plain text](#use-a-connection-configuration-file), you can keep credentials in a KeyStore and provide the KeyStore details in the connection configuration file:

```YAML
credential-store:
  type: {PKCS12|JKS|JCEKS}
  path: PATH_TO_KEYSTORE_FILE
  key-prefix: "PREFIX_OF_THE_KEYSTORE_ENTRY"
  password: KEYSTORE_PASSWORD
```

Replace the following:

- *`PATH_TO_KEYSTORE_FILE`*: The path to your KeyStore file.
- *`PREFIX_OF_THE_KEYSTORE_ENTRY`*: The prefix of your KeyStore entries. You can create entries in the credential store using a prefix that preceeds each credential alias. For example, you can create KeyStore entries with aliases `sqlserver_username` and `sqlserver_password`. Therefore, you need to set `key-prefix` to `sqlserver_`.
- *`KEYSTORE_PASSWORD`*: Optional parameter for the KeyStore password. If you don’t want to specify the KeyStore password here, then you must use the UUID from your license file as the KeyStore password. Keep your license file somewhere safe to keep the KeyStore password secure.

Note that [the following parameters]({{< ref "docs/sources/source-prerequisites/sqlserver#connect-replicant-and-arcion-cdc-agent" >}}) must have entries in the KeyStore:

<dl class="dl-indent">
<dt>

[Parameters for connection between Arcion CDC Agent and Replicant]({{< ref "docs/sources/source-prerequisites/sqlserver#connect-replicant-and-arcion-cdc-agent" >}})
</dt>
<dd>

- `sql-proxy-connection`
- `agent-connection`
- `sql-jobs-username`
- `sql-jobs-password`
</dd>

<dt>

[Parameters for configuration user]({{< ref "docs/sources/source-setup/sqlserver/realtime-replication/arcion-cdc-agent#configuration-user-for-arcion-cdc-agent" >}})
</dt>

<dd>

- `config-username`
- `config-password`
</dd>
</dl>
KeyStore entries for usernames and passwords of the preceding parameters follow this structure:

```
<key-prefix> + “sql-proxy-connection-”
<key-prefix> + “agent-connection-”
<key-prefix> + “sql-jobs-”
```

For example, consider the following KeyStore configuration:

```YAML
credential-store:
  type: PKCS12
  path: /data/store/sqlserver.jks
  key-prefix: "ss_"
  password: test01 
```

For the preceding configuration, you need to add KeyStore entries in the following manner:

<dl class="dl-indent" >
<dt>

[Username](#username) and [password](#password) of SQL Server
</dt>

<dd>

```sh
echo "sa" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_username -keypass test01 -noprompt
echo "Rocket0128" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_password -keypass test01 -noprompt
```
</dd>

<dt>

`sql-jobs-username` and `sql-jobs-password`
</dt>

<dd>

```sh
echo "TEST\administrator" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_sql-jobs-username -keypass test01 -noprompt
echo "Rocket0128" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_sql-jobs-password -keypass test01 -noprompt
```
</dd>

<dt>

Username and password of `sql-proxy-connection`
</dt>

<dd>

```sh
echo "sa" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_sql-proxy-connection-username -keypass test01 -noprompt
echo "Rocket0128" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_sql-proxy-connection-password -keypass test01 -noprompt
```
</dd>

<dt>

Username and password of `agent-connection` username and password
</dt>

<dd>

```sh
echo "alexwin10\alex" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_agent-connection-username -keypass test01 -noprompt
echo "Rocket0128" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_agent-connection-password -keypass test01 -noprompt
```
</dd>

<dt>

Username and password of configuration user
</dt>

<dd>

```sh
echo "sa" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_config-username -keypass test01 -noprompt
echo "Rocket0128" | keytool -importpass -keystore /data/store/sqlserver.jks -storetype pkcs12 -storepass test01 -alias ss_config-password -keypass test01 -noprompt
```
</dd>


## III. Create the heartbeat table 
For [`full` mode replication]({{< ref "docs/running-replicant#replicant-full-mode" >}}), you need to create a heartbeat table. For example:

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

For more information about the configuration parameters in `realtime` mode, see [Realtime Mode]({{< ref "docs/sources/configuration-files/extractor-reference#realtime-mode" >}}).

## Replicate tables without primary keys
To use Arcion CDC Agent as CDC Extractor, we recommend that all replicated tables have primary keys. However, it's possible to replicate tables without primary keys if the tables meet the following criteria:

> _The tables must have a set of non-nullable columns that uniquely identifies each row._

Replicant replicates a table without a primary key by creating a view of that table and then replicating that view instead. By default, each view Replicant creates has the following two properties: 

- Each view belongs to the `dbo` schema. 
- The name of each view starts with the prefix `replicant_`. 

However, you can change these default properties by specifying the following respective parameters in [the SQL Server source connection configuration file](#use-a-connection-configuration-file): 

### `auxiliary-object-schema`
The name of the schema to which the view belongs to.

### `auxiliary-object-prefix`
The prefix to use for the name of each view.

For example, the following connection configuration for SQL Server uses the preceding parameters to set the view properties:

```YAML
type: SQLSERVER

host: localhost
port: 1433

username: 'alex'
password: 'alex1995'

extractor: LOG

max-connections: 30

auxiliary-object-schema: 'admin'
auxiliary-object-prefix: 'price_'
```
