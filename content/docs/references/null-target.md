---
pageTitle: Use the null target to measure extraction performance
title: The Null Target
description: "Arcion Replicant supports using the /dev/null device file as target to measure source extraction performance and validate your configurations."
weight: 10
url: docs/references/null-target
---

# The null target
From version 2023.03.31.14, Arcion Replicant supports the `/dev/null` device file as a "dummy" data target. This allows you to measure source extraction performance and validate your source configurations, without having to configure an actual target platform.

In UNIX and Linux systems, the `/dev/null` device file discards everything we write to it. This makes the null device file perfect for testing and validating one end of a data pipeline by dumping source data into `/dev/null`.

## How to use `/dev/null` as target
To use `/dev/null` as target, follow these steps:

1. Choose and configure a source platform, for example, [Microsoft SQL Server]({{< ref "docs/sources/source-setup/sqlserver/" >}}). 
{{< hint "info" >}}
**Tip:** To see the available sources, visit our [connectors page](https://www.arcion.io/connectors). For documentation on the available sources, expand the **Source Connector Setup** section under **Sources** in the left navigation menu by clicking the <span class="expander-arrow-icon" aria-hidden="true" translate="no">▾</span> expander arrow.
{{< /hint >}}
1. Specify the following configuration for the null target:
    ```YAML
    type: NULLSTORAGE

    storage-location: PATH_TO_VALID_LOCATION
    ```
    Replace `PATH_TO_VALID_LOCATION` with a valid path on disk. 
    
    Arcion Replicant temporarily stores very small files during the process in `storage-location` for internal functions. Replicant doesn't store any source data in that location.

2. Run Replicant with the necessary options and arguments. For example:
    ```sh
    ./bin/replicant snapshot \
    conf/conn/sqlserver.yaml \
    conf/conn/null.yaml \
    --extractor conf/src/sqlserver.yaml \
    ```

    In the preceding command:
    1. We run Replicant in `snapshot` mode for [snapshot replication]({{< ref "docs/sources/source-setup/sqlserver/snapshot-replication" >}}).
    2. We specify the path to [the connection configuration file of the source]({{< ref "docs/sources/source-setup/sqlserver/snapshot-replication#ii-set-up-connection-configuration" >}}) and the null target.
    3. We specify the path to [the Extractor configuration file]({{< ref "docs/sources/source-setup/sqlserver/snapshot-replication#iii-set-up-extractor-configuration" >}}) using the `--extractor` argument.

    The preceding command illustrates a very basic use case of running Replicant with the null target. According to your requirements, you can include [filter]({{< ref "docs/sources/configuration-files/filter-reference" >}}), [mapper]({{< ref "docs/targets/configuration-files/mapper-reference" >}}), [notification]({{< ref "docs/notifications-and-logging/notification-reference" >}}), and other configuration files by specifying different CLI options and arguments. With `/dev/null` as target, you can tune performance and test your source requirements freely. For more information on different Replicant CLI options, see [Running Replicant]({{< relref "running-replicant" >}}).
 