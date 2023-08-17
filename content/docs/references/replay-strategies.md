---
pageTitle: Replay strategies for realtime replication
title: Replay Strategies
description: "Learn how Arcion captures CDC changes for realtime data ingestion into BigQuery and Databricks."
bookHidden: false
weight: 12
url: docs/references/replay-strategies
---

# Replay strategies for BigQuery and Databricks targets

Replay strategies are how Arcion implements CDC changes and applies them in realtime to the target.

## Overview
Replay strategies apply to the following targets:

- [BigQuery]({{< ref "../targets/target-setup/bigquery" >}}) 
- [Databricks]({{< ref "../targets/target-setup/databricks" >}})

Replicant automatically chooses the best replay strategy to use. So you don't always have to explicitly specify it.

You can set the replay strategy using the `replay-strategy` realtime parameter. Arcion supports the following replay strategies for realtime [BigQuery]({{< ref "../targets/target-setup/bigquery" >}}) and [Databricks]({{< ref "../targets/target-setup/databricks" >}}) targets:

### `NONE`
When a set of upcoming operations arrives, the Applier buffers the operations and checks the following criteria: 

- The upcoming operation and the buffered operation has different operation types.
- The upcoming operation depends on the buffered operation.

The Applier applies the buffered batch if the operations meet one of the preceeding criteria. The Applier applies the buffered operations using the `MERGE` statement on target.
 
### `INSERT_DELETE`
Requires FULL logging for after and before images. In this strategy, Replicant takes the following approach to operations:

- Every insert is applied as an insert. 
- Every delete is applied as a delete. 
- Every update or replace is broken down into insert + delete. 

Replicant also introduces a special column called `REPLICATE_IO_VERSION_METADATA`. The _insert-delete approach_ helps preserve only the latest version of each row. It also enables batching even if operations depend on the same row.

### `INSERT_MERGE`
Same as [`INSERT_DELETE`](#insert_delete) but deletes are deleted using `MERGE` statement instead of `DELETE` statement.

### `IN_MEMORY_MERGE`
This strategy applies only to tables with valid row-identifier keys, primary keys, or unique keys. `IN_MEMORY_MERGE` requires only updated columns for logging. 

In this strategy, Replicant calculates the checksum of row identifier keys, primary keys, or unique keys and persists the checksum in memory. Replicant uses this checksum to resolve conflicting operations. For example, update over insert or insert over delete. These conflicting operations are meant to apply to the same row. So Replicant resolves them in memory. After resolving, the Applier applies them using the `MERGE` statement.

There is always a single row-identifier key (might have multiple columns) and a single primary key (might have multiple columns) for a table. If a table has multiple unique keys, we consider only one unique key in the absence of a row-identifier key.