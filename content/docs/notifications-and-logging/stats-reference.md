---
pageTitle: Configure replication statistics
title: Statistics Configuration
description: "Arcion Replicant provides full statistical history of an ongoing replication. Learn how you can configure them to suit your needs."
weight: 6
url: docs/references/stats-reference
---

# Statistics Configuration
Arcion Replicant provides full statistical history of an ongoing replication. This page describes how to set up and configure statistics logging.

## Overview
Replicant uses a [YAML configuration file](#statistics-configuration-file) and logs full statistical history of an ongoing replication. Replicant creates a table `replicate_io_replication_statistics_history` to log the full history of insert, update, delete, and upsert operations across all Replicant jobs. Replicant logs an entry in this table in the following format upon each successful write on a target table:

- `replication_id`
- `catalog_name`
- `schema_name`
- `Table_name`
- `Snapshot_start_range`
- `Snapshot_end_range`
- `Start_time`
- `End_time`
- `Insert_count`
- `Update_count`
- `Upsert_count`
- `Delete_count`
- `Elapsed_time_sec`
- `replicant_lag` _[v20.10.07.10]_
- `total_lag` _[v20.10.07.10]_

## Statistics configuration file
The statistics configuration file specifies different aspects of statistics logging like statistics history and  storage. The configuration file uses YAML syntax. If you're new to YAML and want to learn more, see [Learn YAML in Y minutes](https://learnxinyminutes.com/docs/yaml/). For a sample configuration, see `statistics.yaml` in the `conf/statistics/` directory of your [Replicant self-hosted CLI download folder]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}).

You can define and configure the following parameters in the statistics configuration file:

### `enable`
`{true|false}`.

Enables or disables statistics logging.

### `purge-statistics`
Specifies the purge rules for the statistics history.

### `purge-statistics.enable`
`{true|false}`.

Enables purging of replication statistics history.

### `purge-statistics.purge-stats-before-days`
Number of days to keep the statistics. For example, set this parameter to `30` to keep the statistics history for the last 30 days.

### `storage` _[v20.10.07.16]_
Storage configuration for statistics.

### `storage.stats-archive-type`
Specifies how Replicant archives the statistics data. The following values are supported:
   
`METADATA_DB`
: Stores statistics data in the [metadata database]({{< ref "docs/references/metadata-reference" >}}).

`FILE_SYSTEM`
: Stores statistics data in a file.

`DST_DB`
: Stores statistics data in the target database.
  
   
### `storage.storage-location`
Directory location where Replicant stores statistics files when [`storage.stats-archive-type`](#storagestats-archive-type) is `FILE_SYSTEM`.

### `storage.format`
The format of statistics file when [`storage.stats-archive-type`](#storagestats-archive-type) is `FILE_SYSTEM`. 

The following formats are supported: 
- `CSV`
- `JSON`

_Default: `CSV`._

### `storage.catalog`_[v20.12.04.2]_
The catalog to store statistics in when [`storage.stats-archive-type`](#storagestats-archive-type) is `DST_DB`.

### `storage.schema` _[v20.12.04.2]_
The schema to store statistics in when [`storage.stats-archive-type`](#storagestats-archive-type) is `DST_DB`.

### Sample configuration
```YAML
enable: true
purge-statistics:
  enable: true
  purge-stats-before-days: 30
storage:
  stats-archive-type:  DST_DB
  catalog: "io"
  schema: "replicate"
```