---
pageTitle: SQL Server Target Connector Documentation
title: Microsoft SQL Server
description: "Get realtime data replication into Microsoft SQL Server at scale. Choose from different replication modes and use bulk loading for faster ingestion."
url: docs/target-setup/sqlserver
bookHidden: false
---
# Destination Microsoft SQL Server

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the following steps.

## I. Set up connection configuration
Specify the connection details of your SQL Server instance to Replicant with a connection configuration file. You can find a sample connection configuration file `sqlserver.yaml` in `$REPLICANT_HOME/conf/conn` directory. The following configuration parameters are available:

### `type`
The connection type representing the database. In this case, it's `SQLServer`.

### `host`
The hostname of your SQL Server system.

### `port`
The port number to connect to the `host`.

### `username`
The username credential to access the SQL Server system.

### `password`
The password associated with `username`.

### `max-connections` 
The maximum number of connections Replicant uses to load data into the SQL Server system.

{{< hint "info" >}}
#### For Arcion self-hosted only
You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}).
{{< /hint >}}

The following is a sample connection configuration:

```YAML
type: SQLSERVER

host: 192.168.0.166 
port: 1433

username: 'replicate'
password: 'Replicate#123'

max-connections: 30
```

## II. Configure mapper file (optional)
If you want to define data mapping from source to your target SQL Server, specify the mapping rules in the mapper file. For more information on how to define the mapping rules and run Replicant CLI with the mapper file, see [Mapper Configuration]({{< ref "../configuration-files/mapper-reference" >}}).

## III. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `sqlserver.yaml` in the `$REPLICANT_HOME/conf/dst` directory. 

Arcion Replicant supports the following Replicant modes for SQL Server as target:

- `snapshot`
- `full`
- `realtime`
- `delta-snapshot`

For more information about different Replicant modes, see [Running Replicant]({{< ref "../../running-replicant" >}}).

You can configure replication modes by specifying the parameters under their respective sections in the configuration file. See the following sections for more information.

### Configure `snapshot` mode
The following is a sample configuration for operating in `snapshot` mode:

```YAML
snapshot:
  threads: 32
  batch-size-rows: 10_000
  txn-size-rows: 1_000_000
  identity-column-insert: false
```

#### Additional `snapshot` parameters
<dl class="dl-indent">
  <dt><code>identity-insert-column</code></dt>
  <dd>

  `true` or `false`.

  _Default: `false`._

  Controls how Replicant handles identity columns in the following manner: 

  - **`true`**. Replicant copies the values of identity columns from source to target.  
  - **`false`**. Replicant doesn't copy the values of identity columns from source to target. Instead, Replicant generates the values of identity columns in the target.

  You can use this parameter both globally and in [`per-table-config`]({{< ref "docs/targets/configuration-files#per-table-config-1" >}})s. For example, the following sample disables `identity-insert-column` globally and enables `identity-insert-column` for a table `tableName`:

  ```YAML
  snapshot:
    threads: 32
    batch-size-rows: 10_000
    txn-size-rows: 1_000_000

    identity-column-insert: false

    per-table-config:
    - catalog: catalogName
      schema: schemaName
      tables:
        tableName:
          identity-column-insert: true
  ```
  </dd>

</dl>

#### Use bulk loading
If you want to use bulk loading in snapshot mode, use the `bulk-load` section to specify your configuration. For example:

```YAML
bulk-load:
  enable: true
  type: FILE
  bulk-file-location: \\192.168.0.199\Replicant
```

{{< hint "warning" >}}
**Important:** 
- If you enable bulk loading, make sure to specify the `bulk-file-location` parameter. This is a Samba URL. Using this URL, SQL Server (running on Windows on some network) can access the files Replicant (running on the same network) generates and ingests them. If you disable bulk loading by setting `enable` to `false`, giving any value to `bulk-file-location` will throw parsing error.
    
    The Samba URL must be a valid path so that the Windows machine can access the directory shared by the machine Replicant is running on.

    For information on how to set up the shared directory with Samba, see [Set up shared directory for bulk loading with Samba](#set-up-shared-directory-for-bulk-loading-with-samba).
- Replicant only supports `FILE` type bulk loading.
{{< /hint >}}

For more information about the configuration parameters for snapshot mode, see [Snapshot Mode]({{< ref "../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure `realtime` mode
The following is a sample configuration for operating in `realtime` mode:

```YAML
realtime:
  threads: 8
  txn-size-rows: 10000
  batch-size-rows: 1000
  identity-column-insert: false
```

#### Additional `realtime` parameters
<dl class="dl-indent">
  <dt><code>identity-insert-column</code></dt>
  <dd>

  `true` or `false`.

  _Default: `true`._

  Controls how Replicant handles identity columns in the following manner:

  - **`true`**. Replicant copies the values of identity columns from source to target.  
  - **`false`**. Replicant doesn't copy the values of identity columns from source to target. Instead, Replicant generates the values of identity columns in the target.

  You can use this parameter both globally and in [`per-table-config`]({{< ref "docs/targets/configuration-files#per-table-config-1" >}})s. For example, the following sample enables `identity-insert-column` globally and disables `identity-insert-column` for a table `tableName`:

  ```YAML
  realtime:
    threads: 8
    txn-size-rows: 10000
    batch-size-rows: 1000

    identity-column-insert: true

    per-table-config:
      - catalog: catalogName
        schema: schemaName
        tables:
          tableName:
            identity-column-insert: false
  ```
  {{< hint "warning" >}}**Important:** Make sure to set `identity-insert-column` to `true` when you use identity column as primary key in `realtime` mode.{{< /hint >}}
  </dd>

</dl>

For more information about the configuration parameters for `realtime` mode, see [Realtime Mode]({{< ref "/docs/targets/configuration-files#realtime-mode" >}}).

## Delta-snapshot modes
Arcion Replicant supports the following `delta-snapshot` modes:

<dl class="dl-indent">
  <dt><code>UPDATE_INSERT</code></dt>
  <dd> This mode works in the following manner:
    <ul> 
    <li>Data is inserted into a temporary table.</li>
    <li>Non-matching data is inserted from the temporary table into the original table.</li>
    <li>Matching data is updated from the temporary table to the original table.</li>
    </ul>
  </dd>

  <dt><code>DELETE_INSERT</code></dt>
  <dd>This mode works in the following manner:
    <ul>
    <li>Data is inserted into a temporary table.</li>
    <li>Matching data is deleted from the original table.</li>
    <li>Data is copied from the temporary table to the original table.</li>
    </ul>
  </dd>

  
  <dt><code>SINGLE_DELETE_INSERT</code></dt>
  <dd>
 	This mode works in same way as <code>DELETE_INSERT</code> except that it works in parallel for multiple Applier threads.
  </dd>

## Enable recovery
To enable recovery, you must run Replicant CLI with the `--replace` option. For more information, see [Running Replicant]({{< ref "../../running-replicant" >}}).

## Set up shared directory for bulk loading with Samba
We use Samba to share a directory between the host running Replicant and the Windows VM running SQL Server. When using bulk loading, this shared directory allows the Windows VM access to the data files Replicant generates. Follow these steps for sharing directories across network without the hassle of passwords:

1. Install Samba with the following command:
    ```sh
    samba sudo apt install samba
    ```

2. Back up your original Samba configuration file: 

    ```sh
    cp /etc/samba/smb.conf /etc/samba/smb.conf.orig
    ```

3. Open `/etc/samba/smb.conf` and replace its content with the following content:

    ```TOML
    [Replicant]
    path = PATH_TO_SHARED_DIR
    force user = USERNAME
    force group = GROUPNAME
    create mask = 0664
    force create mode = 0664
    directory mask = 0775
    force directory mode = 0775
    public = yes
    writable = yes
    ```

    Replace the following:

    - _`PATH_TO_SHARED_DIR`_: the path to the shared directory on the network—for example, `/home/replicant/arcion_work/replicant-core/data/{replication_id}/tmp`_
    - _`USERNAME`_: the effective username for a user accessing `path`
    - _`GROUPNAME`_: the effective group for a user accessing `path`
  
    Other machine on the same network or VM sees the `path` with the `Replicant` section name (specified in square brackets). Make sure that `force user` and `force group` both have permissions to read files from the shared directory.

4. Finally, restart the systemd service: 
   
    ```sh
    sudo systemtcl restart smbd.service
    ```

 

  Now you can run Replicant with bulk loading enabled.

  {{< hint "warning" >}}
  **Caution:** Whenever you change the replication ID, you need to make changes to `smb.cnf` and then restart the systemd service manually.
  {{< /hint >}}

