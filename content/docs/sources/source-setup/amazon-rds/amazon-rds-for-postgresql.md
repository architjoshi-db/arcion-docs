---
pageTitle: Amazon RDS for PostgreSQL connector by Arcion  
title: PostgreSQL
description: "Get fast data ingestion into Amazon RDS for PostgreSQL using Arcion."
url: docs/source-setup/amazon-rds/amazon-rds-for-postgresql
bookHidden: false
---

# Destination Amazon RDS for PostgreSQL
This page describes how to replicate data in real time from [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/), a managed service for PostgreSQL relational database.

The following steps refer to the extracted [Arcion self-hosted CLI]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}) download as the `$REPLICANT_HOME` directory.

## Prerequisites

### I. Set up parameter group
1. [Create a database parameter group](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithDBInstanceParamGroups.html#USER_WorkingWithParamGroups.Creating) if you haven't already specified a parameter group for your database instance.
2. Set the `rds.logical_replication` parameter to `1` and attach `rds.logical_replication` to your database instance. You must reboot your database instance for this change to take effect. After rebooting your database instance, the `wal_level` parameter automatically sets to `logical`.

    You can verify the values for `wal_level` and `rds.logical_replication` with the following command from `psql` client:

    ```SQL
    postgres=> SELECT name,setting FROM pg_settings WHERE name IN ('wal_level','rds.logical_replication');
    ```

    The output is similar to the following:

    ```
              name           | setting
    -------------------------+---------
    rds.logical_replication | on
    wal_level               | logical
    (2 rows)
    ```
3. In the parameter group, make sure `max_replication_slots` equals to `1` or greater than the number of replication jobs that you need to run from this RDS for PostgreSQL instance.

### II. Create user
1. Create a user for replication in the source RDS for PostgreSQL database instance. For example, the following creates a user `alex`:
    ```SQL
    postgres=> CREATE ROLE alex LOGIN PASSWORD 'alex12345';
    ```
    For more information about creating users, see [Understanding PostgreSQL roles and permissions](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.PostgreSQL.CommonDBATasks.Roles.html).
2. Grant the necessary permissions:
    ```SQL
    postgres=> GRANT USAGE ON SCHEMA "arcion" TO alex;
    postgres=> GRANT SELECT ON ALL TABLES IN SCHEMA "arcion" TO alex;
    postgres=> ALTER ROLE alex WITH REPLICATION;
    ```

    The preceding commands grant the necessary permissions to user `alex` for the schema `arcion`.

### III. Create logical replication slot
1. Log into the PostgreSQL catalog or database with a privileged account that you want to perform replication with.
2. Create a logical replication slot in this catalog or database using the `wal2json` decoding plugin:
    ```SQL
    SELECT 'init' FROM pg_create_logical_replication_slot('arcion_test', 'wal2json');
    ```

    The preceding command creates a replication slot with the name `arcion_test`. The `wal2json` plugin is [available as an extension in RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-extensions.html).
3. Verify that you've successfully created a replication slot:
    ```SQL
    postgres=> SELECT * from pg_replication_slots;
    ```