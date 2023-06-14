---
pageTitle: Get started with Arcion Self-hosted 
title: Arcion Self-hosted
description: "Quickly get started with Arcion self-hosted. Learn about hardware requirements, download Arcion Replicant, and set up sources and targets."
weight: 2
---

# Arcion self-hosted quickstart

## I. Host machine requirements

In order to run Replicant, we recommend that the machine Replicant runs on meet a set of minimum requirements. Failing to meet these requirements might impact performance or might stop Replicant from being able to run at all.

Please ensure your host machine or server where Replicant runs on meets the following minimum hardware and software requirements.

### Minimum hardware requirements
* 16 CPU cores and 32GB of memory
* 100GB-200GB of SSD/NVMe storage space

### Minimum system requirements
* Linux (CentOS/Ubuntu/Redhat)
* JDK 8 (JRE or JDK installation)

{{< hint "info" >}}
**Note:** The storage requirements may increase depending on your source-target pair and method of replication. For more information, check out the documentation for each specific source and target you need to use or reach out to [our support team](https://support.arcion.io/hc/en-us).
{{< /hint >}}

## II. Download Replicant and create `REPLICANT_HOME`

Replicant is available through a ZIP file that you must download to the machine or server where you want to host Replicant. If you do not already have the ZIP file and/or an Arcion license, [contact our team](http://www.arcion.io/contact) to get access.

Once you have access to the ZIP file, download it to the  directory of your choice on the host machine or server and unzip it:

```BASH
unzip replicant-cli-<version>.zip
```

Unzipping the archive creates a directory ```replicant-cli```. We refer this directory as ```$REPLICANT_HOME``` throughout the documentation and Arcion website. 

## III. Adding a license

Before running Replicant, you need to add a license file to the ```REPLICANT_HOME``` directory. You must name the license file `replicant.lic` so that Replicant can detect the license when Replicant starts.  

If you require a license file, [contact our team](http://www.arcion.io/contact) to get one. We will happily provide users with a 30-day free trial license to try out the product or run a POC.

To add the license file, follow these steps:

1. Obtain an Arcion license file.
2. Rename the license file to `replicant.lic`.
3. Move or copy the `replicant.lic` file into the ```REPLICANT_HOME``` directory. You must copy the `replicant.lic` file into the root directory, not in the `licenses` folder of Replicant.

## IV. Set up a source database

After getting Replicant downloaded and adding the license, you can create your source connector. The source connector will be the database where data will be migrated or replicated from.

For configuring a source connector, a few configuration files are required. These files include:
* connection configuration file
* filter configuration file
*

To set up a source connector, you'll need to do the following:

1. From ```REPLICANT_HOME``` navigate to the sample connection configuration file of the source database:

    ```BASH
    vi conf/conn/<database-name>.yaml
    ```

    Make the necessary changes as shown below:

    ```YAML
    type: <database-name>

    host: <host> #Enter the hostname or IP address to connect to the source
                 #database
    port: <port> #Enter the port on which the source database server is running

    username: <database-username> #Enter the source database username
    password: <user-password>  #Enter the source database password

    max-connections: 30

    max-retries: 10
    retry-wait-duration-ms: 1000
    ```

    Please note that certain databases might have additional configuration parameters. For example, [Oracle has the additional parameter ```service-name```]({{< ref "docs/sources/source-setup/oracle/setup-guide/oracle-traditional-database#v-set-up-connection-configuration" >}}).

    For further database specific examples, please refer to one of our Source database setup pages.

2. From ```REPLICANT_HOME```, navigate to the sample filter file of the source database:

   ```BASH
   vi filter/<source-database-name>_filter.yaml
   ```

   Make the necessary changes as shown below:

   ```YAML
   allow:
   - catalog: "catalog_name" #Enter your database name if applicable
     schema : "schema_name" #Enter your schema name if applicable
     types: [TABLE,VIEW] #Database object types to replicate
     allow:
       "Table_Name1": #Enter the name of your table
       "Table_Name2": #Enter the name of your table

   ```

## V. Set up target database

1. From ```REPLICANT_HOME``` navigate to the sample connection configuration file of the target database:

    ```BASH
    vi conf/conn/<database-name>.yaml
    ```

    Make the necessary changes as shown below:

    ```YAML
    type: <database-name>

    host: <host> #Enter the hostname or IP address to connect to the target
                 #database
    port: <port> #Enter the port on which the target database server is running

    username: <database-username> #Enter the target database username
    password: <user-password>  #Enter the target database password

    max-connections: 30

    max-retries: 10
    retry-wait-duration-ms: 1000
    ```

    For database specific examples, please refer to one of our Target database setup pages.


## VI. Run Replicant in snapshot mode

Replicant is now ready to run in snapshot mode. The snapshot will only transfer existing data from the source database to the target database. If you would like to transfer real-time changes in addition to the snapshot, skip step VI and proceed to steps VII and VIII to run Replicant in full mode.

1. Execute the following command from ```REPLICANT_HOME``` to run Replicant in snapshot mode:

   ``` BASH
   ./bin/replicant snapshot conf/conn/<source-database-name>.yaml \
   conf/conn/<destination-database-name>.yaml \
   --extractor conf/src/<source-database-name>.yaml \
   --applier conf/dst/<destination-database-name>.yaml \
   --filter filter/<source-database-name>_filter.yaml
   ```

The proceeding steps are only required if you intend to run Replicant in real-time mode.

## VII. Set up heartbeat table

1. Create a heartbeat table in the catalog/schema you are going to replicate with the following DDL:

   ```SQL
   CREATE TABLE <catalog>.<schema>.replicate_io_cdc_heartbeat( \
   timestamp <data_type_equivalent_to_long>)
   ```

2. Grant ```INSERT```, ```UPDATE```, and ```DELETE``` privileges to the user configured for Replicant.

3. From ```REPLICANT_HOME```, navigate to the heartbeat table's configuration.
   ```BASH
   vi conf/src/<source-database-name>.yaml
   ```
4. Under the Realtime Section, make the necessary changes as follows

   ```YAML
   heartbeat:
     enable: true
     catalog: <catalog_name> #if the source database supports catalog, change the catalogue name accordingly
     schema: <schema_name> #if the source database supports schema, change the schema name accordingly
     interval-ms: 10000
    ```

## VIII. Run Replicant in full mode

1. From ```REPLICANT_HOME```, enter the following to run Replicant in full mode:

   ```BASH
   ./bin/replicant full conf/conn/<source-database-name>.yaml \
   conf/conn/<destination-database-name>.yaml \
   --extractor conf/src/<source-database-name>.yaml \
   --applier conf/dst/<destination-database-name>.yaml \
   --filter filter/<source-database-name>_filter.yaml \
   ```

## Upgrade Arcion Replicant

We recommend that you always use the latest version of Replicant. That way, you can enjoy the latest features and various quality improvmements. 

You can grab the latest version of Replicant from our [Arcion Self-hosted page](https://www.arcion.io/self-hosted).

To get the most out of your upgrades, follow the tips below:

- Keep the configuration files isolated from the `replicant-cli` directory tree. During version upgrades, they might get overwritten.
- After upgrade, copy your `replicant.lic` license file [to the new `REPLICANT_HOME`](#download-replicant-and-create-replicant_home).
- Copy the contents of your older `$REPLICANT_HOME/lib` directory to the new version `lib` directory `$REPLICANT_HOME/lib`.

## Database Specific Setup Overview

Different source and target databases might have slightly more specific and different setup instructions than the general guidelines provided in this quickstart guide. Follow these six steps for a pipeline-specific setup for Replicant:

1. Setting up the source database.
2. Setting up the target database. 
3. Running Replicant.
4. Performance enhancing and troubleshoot.
