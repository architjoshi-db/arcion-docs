---
pageTitle: General configuration of Arcion Replicant
title: Replicant System Configuration
description: "Learn about the general system configuration parameters that that allows you to optionally tune Replicant's behavior and functions."
---

# General system configuration of Replicant
You can optionally configure several system parameters of Replicant. These parameters control Replicant's various behavior and functions in replication—for example, tracing, logging, and information dashboard. 

This feature is available since version 20.07.16.5.

To configure Replicant's system parameters:

1. Specify the general configuration parameters in a YAML configuration file.
2. Run Replicant with the `--general` option and provide the full path to the general configuration file.

## System configuration parameters

### `liveness-monitor`
Controls liveness checks of Replicant. This allows you to configure how Replicant stops and resumes replication in different situations.

<dl class="dl-indent">
<dt>

`enable`</dt>
<dd>

`{true|false}` 

Enable liveness monitoring.
</dd>

<dt>

`inactive-timeout-ms`
</dt>

<dd>
Specifies the replication inactivity time in milliseconds. If the liveness monitor detects no replication activity in this time period, Replicant stops and resumes replication.

_Default: `900_000` (15 minutes)._
</dd>
<dt>

`snapshot-extractor-inactive-timeout-ms`
</dt>
<dd>

Specifies the time period when no snapshot extraction activity occurs. If the liveness monitor detects no snapshot extraction activity in this time period, Replicant stops and resumes replication. If you don't specify this parameter, it takes the value of `inactive-timeout-ms`.

_Default: The value of `inactive-timeout-ms`._
</dd>

<dt>

`snapshot-applier-inactive-timeout-ms`
</dt>
<dd>


Specifies the time period when no snapshot Applier activity occurs. If the liveness monitor detects no snapshot Applier activity in this time period, Replicant stops and resumes replication. If you don't specify this parameter, it takes the value of `inactive-timeout-ms`.

_Default: The value of `inactive-timeout-ms`._

</dd>

<dt>

`realtime-extractor-inactive-timeout-ms`
</dt>
<dd>

Specifies the time period when no realtime extraction activity occurs. If the liveness monitor detects no realtime extraction activity in this time period, Replicant stops and resumes replication. If you don't specify this parameter, it takes the value of `inactive-timeout-ms`.

_Default: The value of `inactive-timeout-ms`._
</dd>

<dt>

`realtime-applier-inactive-timeout-ms`
</dt>
<dd>

Specifies the time period when no realtime Applier activity occurs. If the liveness monitor detects no realtime Applier activity in this time period, Replicant stops and resumes replication. If you don't specify this parameter, it takes the value of `inactive-timeout-ms`.

_Default: The value of `inactive-timeout-ms`._
</dd>

<dt>

`min-free-memory-threshold-percent`
</dt> 
<dd>

If free memory drops below this threshold, Replicant stops and resumes operation.
</dd>

<dt>

`liveness-check-interval-ms`
</dt>

<dd>

Specifies the time interval between two successive liveness checks in milliseconds.
</dd>

### `schema-validation`*[v20.09.14.8]*
Enables and configures schema validation. Replicant displays schema validation errors in the information dashboard.

<dl class="dl-indent">
<dt>

`enable`
</dt>
<dd> 

`{true|false}`.

Enables schema validation. Replicant validates the target schema against the source schema. </dd>
<dt>

`error-types`
</dt>
<dd>

Specifies the error types in an array. The following error types are supported:

- `ALL`
- `ERRORS`
- `WARNINGS`
- `COL_CNT_MISMATCH`
- `COL_TYPE_MISMATCH`

_Default: `[ALL]`._
</dd>
<dt>

`warning-as-error`
</dt>
<dd>


`{true|false}`.

Whether to consider warnings as errors.

_Default: `false`._
</dd>
<dt>

`dump-schema-mapping`
</dt>
<dd>

`{true|false}`.

Controls whether or not Replicant dumps the mapping between source and target schemas.
</dd>
</dl>

### `permission-validation`
Validates whether user possesses appropriate permissions to read table data in a particular database. This parameter works in [`snapshot`]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}) and [`full`]({{< ref "docs/running-replicant#replicant-full-mode" >}}) mode replication.

`permission-validation` shows expected behavior for the following databases:

- Microsoft SQL Server
- MySQL
- Oracle
- Snowflake

<dl class="dl-indent" >
<dt>

`enable`
</dt>
<dd>

`{true|false}`.

Enables permission validation.

_Default: `true` for Databricks and Snowflake targets, `false` otherwise._
</dd>

### `fencing` *[v20.10.07.3]*
This parameter allows you to prevent multiple instances of Replicant from executing simultaneously. Consider the situation when the same replication gets [resumed]({{< ref "docs/running-replicant#various-replication-options-explanation" >}}) twice, leading to two replication processes trying to perform the same job. Fencing ensures that the older replication process terminates as soon as a new replication process starts.

Replicant achieves this functionality by using validation tokens. A validation token consists of a monotonically increasing counter. Each replication obtains this counter at the start. Before each action on the respective storage, the replication job performs validation against this counter. Thus a validation token acts as a _fence_ around the metadata and destination storage.

Fencing works in the following manner depending on the configuration:

- In `DDL` fencing, Replicant embeds the validation token into the table name.
- In `DML` fencing, Replicant embeds validation token into a row value and keeps it in the respective fencing table
- Secifying `NONE` disables fencing for the respective storage.

<dl class="dl-indent" >
<dt>

`enable-metadata-fence`
</dt>
<dd>

Enables and specifies metadata fencing. 

The following values are supported:

- `DDL`
- `DML`
- `NONE` 

_Default: `DDL` for JDBC metadata databases._
</dd>
  
<dt>

`enable-dst-fence`
</dt>
<dd>

Enables and specifies fencing on the destination database. 

The following values are supported:

- `DDL`
- `DML`
- `NONE` 

_Default: `DDL` for JDBC databases._

</dd>
<dt>

`enable-dst-query-fence` *[v20.02.01.13]*
</dt>
<dd>

Enables and specifies query fencing on the destination database. 

The following values are supported:

- `DDL`
- `DML`
- `NONE` 

_Default: `DDL` for JDBC databases._

</dd>
<dt>

`heartbeat-interval-ms`
</dt>
<dd>

Specifies the time interval between successive heartbeat signals in milliseconds.

_Default: `30_000`_
</dd>
</dl>

### `data-dir` *[v20.12.04.4]*
Specifies the directory to store temporary files related to bulk loading. 

If you don't specify [`trace-dir`](#trace-dir-v2012044), `data-dir` also stores [the `trace.log` file]({{< relref "troubleshooting#the-log-files" >}}).

_Default: `data/`._

### `trace-dir` *[v20.12.04.4]*
Specifies the directory location for [the `trace.log` file]({{< relref "troubleshooting#the-log-files" >}}). 

If you set [`data-dir`](#data-dir-v2012044), Replicant creates `trace-dir` inside the [`data-dir`](#data-dir-v2012044) directory.

_Default: `data-dir/default`._

### `error-trace-dir`
Specifies the directory location for [the `error-trace.log` file]({{< relref "troubleshooting#the-log-files" >}}). If you set [`data-dir`](#data-dir-v2012044), Replicant creates `error-trace-dir` inside the [`data-dir`](#data-dir-v2012044) directory.

_Default: `data-dir/default`._

### `trace-time-zone` *[v20.12.04.8]*
The `trace.log` file contains timestamps in a specific timezone. This parameter allows you to specify the timezone to use.

For example, with `trace-time-zone: Asia/Kolkata`, `trace.log` contains timestamps as `2021-01-07 19:08:24.530 IST`.

_Default: `UTC`. For example, `2021-01-07 13:40:23.462`._

### `trace-level` *[v20.12.04.12]*
Specifies the level of logback tracing. You can choose among the following trace levels: 

- `DEBUG`
- `INFO`
- `ERROR`
- `WARNING`

_Default: `DEBUG`._

### `archive-trace` *[v20.12.04.12]*
`{true|false}`.

Archives trace logs on a daily basis into time stamped files.

_Default: `true`._

### `purge-trace-before-days` *[v20.12.04.12]*
Specify the number of days to keep `trace.log` archives. Older trace logs are automatically deleted.

_Default: `0`._

### `sensitive-info-trace-dir` *[v20.12.04.16]*
`{true|false}`.

If `true`, Replicant logs sensitive trace messages into a separate file in the `sensitive_trace_directory` directory.

_Default: `true`._

### `dashboard-dump-file` *[v21.04.06.1]*
Replicant can dump the contents of the information dashboard in a file. This parameter allows you to configure its behavior.   

<dl class="dl-indent" >
<dt>

`enable`
</dt>
<dd>

`{true|false}`. 

_Default: `false`._
</dd>
<dt>

`storage`
</dt>
<dd>

`{FILE|SQLITE}`.

_Default: `FILE`._
</dd>
<dt>

`location`
</dt>
<dd>

Directory location for the dashboard dump file. The dump file is periodically udpated.
</dd>
<dt>

`format`
</dt>
<dd>


`{TEXT|JSON}`.

Specifies the file format for the dashboard dump file.

_Default: `TEXT`._
</dd>
<dt>

`interval-ms`
</dt>
<dd>

Specifies the time interval for updating the dashboard dump file in milliseconds.

_Default: `1000`._ 
</dd>
</dl>

### `license-path` *[v21.05.04.3]*
Specifies the location of the license file.

### `db-connection-tracing` *[v21.05.04.6]*
`{true|false}`.

Replicant can collect diagnostics on database connection usage. This parameter allows you to enable 
stack trace dump during the diagnostics.

_Default: `false`._

### `metadata`
This parameter allows you to reuse metadata tables.

<dl class="dl-indent">
<dt>

`reuse-metadata-tables`
</dt>
<dd>

`{true|false}`.

Whether to reuse metadata tables instead of creating new ones.

_Default: `false`._
</dd>
</dl>

### `report-dir` 
Controls where Replicant stores reports, such as the permission validation report.

### `log-pattern`
Allows you to change the log format—for example, `"%d{HH:mm:ss.SSS} [%t] [replicant] %-5level %logger{35} - %msg %n"`. For more information, see [the logback documentation](https://logback.qos.ch/manual/layouts.html).

### `enable-console-logger`
Enables logging in the console. Normally, these logs go to the `trace.log` file.

### `cleanup-dst`
`{true|false}`.

Whether to clean up target metadata tables.

### `ntp-server` 
Allows you to specify the time server for license validation. 

_Default: `time.google.com`._

## Sample configuration
You can find a sample Replicant system configuration file inside the `conf/general` directory of your [Arcion self-hosted download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}).

The following shows a sample configuration:

```YAML
liveness-monitor:
  enable: true
  inactive-timeout-ms: 900000
  min-free-memory-threshold-percent: 5
  liveness-check-interval-ms: 60000

schema-validation:
  enable: false

permission-validation:
  enable: false

archive-trace: true
purge-trace-before-days: 30

fetch-schema:
  skip-tables-on-failure: true

metadata:
  reuse-metadata-tables: true
```

## Run Replicant with your configuration
After configuring the system parameters, run Replicant with the `--general` option and give it the full path to your configuration file. For example:

```sh
./bin/replicant delta-snapshot conf/conn/oracle.yaml conf/conn/singlestore.yaml \
--general conf/general/general.yaml \
--extractor conf/src/oracle.yaml \
--applier conf/dst/singlestore.yaml \
--replace-existing --overwrite --id repl1 --resume
```