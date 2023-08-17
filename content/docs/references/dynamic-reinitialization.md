---
pageTitle: Dynamic addition, removal, and reinitialization of tables
title: Dynamic Reinitialization
description: "Learn how Arcion Replicant lets you to add, remove, and reinitialize tables in an ongoing replication job."
weight: 8
url: docs/references/dynamic-reinitialization
---

# Dynamic reinitialization
Replicant lets you to add and remove tables or views during a replication job. The reinitialization process consists briefly of the following two procedures:  

1. Specify the reinitialization parameters in a YAML configuration file. 
2. Run Replicant with the `--reinitialize` option and provide the full path to the reinitialization configuration file.

## The reinitialization configuration parameters
### `catalog`
The catalog of the tables that require reinitialization.

### `schema`
The schema of the tables that require reinitialization.

### `remove-tables`
A list of table names that you want to permanently remove from this replication jobs’s replication set. However, `remove-tables` doesn't drop the table on target, it only stops the replication job from replicating the tables to the target tables.

### `add-tables`
A list of tables that you want to add in the replication set.

### `reinit-tables`
A list of tables to reinitialize from scratch. Reinitialization means that the target tables lose all data and undergo a fresh reinitialization.

### `refresh-schema-tables`
Boolean parameter. `true` or `false`.

A user might perform some schema modification operations—for example, add, drop, or modify operations on columns. Afterwards, the user might want to resume replication with the updated schema. In this scenario, set this parameter to `true` so that Replicant refreshes the schema for the tables.

## Step-by-step example of reinitialization
1. Consider that you start a replication job with the following command:

    ```sh
    ./bin/replicant delta-snapshot conf/conn/greenplum.yaml conf/conn/singlestore.yaml \
    --extractor conf/src/greenplum.yaml \
    --applier conf/dst/singlestore.yaml \
    --statistics conf/statistics/statistics.yaml \
    --filter filter/greenplum_filter.yaml \
    --map mapper/greenplum_to_singlestore.yaml \
    --replace-existing --overwrite --id repl1 --resume
    ```
2. Stop the replication by pressing <kbd>Control</kbd> + <kbd>C</kbd>.
3. Set up the [reinitialization configuration file](#the-reinitialization-configuration-parameters) properly.
4. Make sure that the `allow` list of the [Filter configuration file]({{< relref "filter-reference" >}}) includes all the tables inside the [`add-tables` list](#add-tables).
5. Specify all the configuration parameters properly in the [Extractor configuration file]({{< relref "extractor-reference" >}}) for the tables in the [`add-tables` list](#add-tables).  
6. Start the replication job with the exact same command as the first step with the additional option `--reinitialize`. This option takes the full path to the reinitialization configuration file.

    ```sh
    ./bin/replicant delta-snapshot conf/conn/greenplum.yaml conf/conn/singlestore.yaml \
    --extractor conf/src/greenplum.yaml \
    --applier conf/dst/singlestore.yaml \
    --statistics conf/statistics/statistics.yaml \
    --filter filter/greenplum_filter.yaml \
    --map mapper/greenplum_to_singlestore.yaml \
    --replace-existing --overwrite --id repl1 --resume
    --reinitialize conf/reinit/db_reinit.yaml
    ```
