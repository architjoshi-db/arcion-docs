---
pageTitle: Documentation for realtime replication from SQL Server
title: "Real-time replication"
description: "In-depth guide for setting up real-time replication from SQL Server, using change tracking and Arcion CDC Agent."
bookCollapseSection: true
weight: 2
url: docs/source-setup/sqlserver/realtime-replication
---

# Real-time replication from SQL Server
Real-time replication allows you to apply real-time changes in your source SQL Server to your target database.


## Overview
In [real-time mode]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}), Replicant first creates the destination schemas if they don't exist. If the destination schemas exist, Replicant appends to the existing tables. In real-time replication, Replicant obtains real-time operations from log-based CDC and starts replicating those operations. By default, Replicant starts replicating from the latest log position, but you can also specify [a custom starting position]({{< ref "../../../configuration-files/extractor-reference#start-position-v2009141" >}}).

You can enable real-time replication by running Replicant with the following options:

- `realtime`
- `full`

Full mode replication is a combination of snapshot and real-time mode replication. For more information, see [Full mode replication]({{< relref "../full-mode-replication" >}}).

## CDC Extractor in real-time replication
For `realtime` and `full` mode replicaiton from SQL Server, you can choose from two CDC Extractors. You can specify the Extractor to use by setting the `extractor` parameter in the connection configuration file.

- [Change tracking]({{< relref "change-tracking" >}})
- [Arcion CDC Agent]({{< relref "arcion-cdc-agent" >}})

Follow the instructions in these two pages to operate Replicant in `realtime` and `full` mode.

## Support for DDL replication
Replicant [supports DDL replication for real-time SQL Server source]({{< ref "docs/sources/ddl-replication" >}}). For more information, [contact us](https://arcion.io/contact).