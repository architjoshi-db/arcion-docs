---
pageTitle: DDL replication support 
title: DDL Replication
description: "Arcion supports DDL replication for source databases that allows you to replicate DDL changes on source to the target database."
weight: 4
---

# DDL replication
Arcion Replicant supports DDL replication for different databases. This allows DDL operations you apply on source to replicate over to the target database while Replicant runs in real-time mode.

## Supported databases
Arcion supports DDL replication for the following source and target database platforms:

### Supported sources
- [Oracle]({{< relref "source-setup/oracle" >}})
- [PostgreSQL]({{< relref "source-setup/postgresql" >}})
- [SQL Server]({{< relref "source-setup/sqlserver" >}})
- [DB2 LUW]({{< relref "source-setup/db2/db2_native_luw" >}})
- [MySQL]({{< relref "source-setup/mysql" >}})

### Supported targets
- [PostgreSQL]({{< relref "../targets/target-setup/postgresql" >}})
- [Snowflake]({{< relref "../targets/target-setup/snowflake" >}})
- [Google Big Query]({{< relref "../targets/target-setup/bigquery" >}})
- [Databricks]({{< relref "../targets/target-setup/databricks" >}})
- [SingleStore]({{< relref "../targets/target-setup/singlestore" >}})
- [MySQL]({{< relref "../targets/target-setup/mysql" >}})

For more information about DDL support and what it can do for you, please [contact us](https://arcion.io/contact).