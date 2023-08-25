---
pageTitle: Writing data to local storage 
title: Local Storage
description: "Arcion supports writing data to the disk in CSV format instead of sending the data to an external target database."
url: docs/target-setup/localstorage
bookHidden: false
---

# Destination local storage
Arcion supports writing data locally to your disk in CSV format instead of sending it to an external target database. This page contains instructions on how to use your local storage as a real time destination for different data sources.

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) download as the `$REPLICANT_HOME` directory.

## I. Set up connection configuration
Specify the connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `localstorage.yaml` in the `$REPLICANT_HOME/conf/conn` directory. 

Specify the connection details in the following manner:

```YAML
type: LOCALSTORAGE
access-method: LOCAL
storage-location: "PATH_TO_STORAGE_LOCATION"
file-format: CSV
```

Replace *`PATH_TO_STORAGE_LOCATION`* with the location on your disk where you want to save your data.

## II. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `localstorage.yaml` in the `$REPLICANT_HOME/conf/dst` directory.

### Common configuration parameters
<dl class="dl-indent">
<dt>

`encode-binary-to-base64`
</dt>
<dd>

{`true`|`false`}.

Whether to convert binary data into base64 when writing to local storage.

_Default: `false`._
</dd>
</dl>

### Configure `snapshot` mode
For operating in [`snapshot` mode]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), specify your configuration under the `snapshot` section of the configuration file:

```YAML
snapshot:
  threads: 16

  txn-size-rows: 1_000_000
  max-file-size: 33_554_432 # 32MB

  delimiter: ','
  quote: '"'
  escape: '"'

  include-header: {true|false}

  zip: GZIP

  encode-binary-to-base64: {true|false}
```

The `include-header` parameter allows you to choose whether or not you want CSV header in CSV file.

For more information about the Applier parameters for `snapshot` mode, see [Snapshot mode]({{< relref "../configuration-files/applier-reference#snapshot-mode" >}}).

### Configure real-time replication
For operating in [`realtime` mode]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}), specify your configuration under the `realtime` section of the conifiguration file:

```YAML
realtime:
  threads: 16
  encode-binary-to-base64 : true
```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "../configuration-files/applier-reference#realtime-mode" >}}).