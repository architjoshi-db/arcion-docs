---
pageTitle: IBM Informix Source Connector 
title: IBM Informix
description: "Get in-depth documentation for Informix as Source in Arcion. Set up CDC, configure logical logs, and use the latest Source Column Transformation feature."
url: docs/source-setup/informix
bookHidden: false
---

# Source IBM Informix

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## Obtain the Informix JDBC driver
Arcion Replicant requires Informix JDBC driver as a dependency. To make sure Replicant can access the necessary dependency files, follow these steps:

1. Download [the Informix JDBC driver JAR file](https://repo1.maven.org/maven2/com/ibm/informix/jdbc/4.50.3/jdbc-4.50.3.jar). 
2. After downloading the JAR file, put it inside the `lib/` directory of your [Replicant self-hosted download folder]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}).

## I. Set up CDC Replication

For enabling CDC-based replication from the source Informix server, please follow the instructions in [Enabling CDC Replication for Informix]({{< ref "docs/sources/source-prerequisites/informix#enabling-cdc-replication" >}}).

## II. Set up Logical Log Configuration

For setting up logical log configuration, follow the instructions in [Logical Log Configuration Guidelines](/../../references/source-prerequisites/informix/#logical-log-configuration-guidelines).

## III. Create the Heartbeat Table

For CDC replication, you must create the heartbeat table on the source database with the following DDL:

Remember to grant `INSERT`, `UPDATE`, and `DELETE` privileges for this table to the user that you provided to Replicant.

```SQL
CREATE TABLE tpch:tpch.replicate_io_cdc_heartbeat(timestamp INT8 NOT NULL, PRIMARY KEY(timestamp) CONSTRAINT cdc_heartbeat_id_repl1_repl1) 
LOCK MODE ROW
```

## IV. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:

   ```BASH
   vi conf/conn/informix.yaml
   ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
    
    ```YAML
    type: INFORMIX

    host: localhost #Replace localhost with your Informix server's hostname
    port: 9088  # In case of SSL connection use SSL port

    server: 'informix'
    database: 'tpch' # Name of the catalog from which the tables are to be replicated

    username: 'informix' #Replace informix with the user that connects to your Informix server
    password: 'in4mix' #Replace in4mix with your user's password 
    informix-user-password: 'in4mix' #Password for the "informix" user, required for performing CDC. Not required in snapshot replication.

    max-connections: 15
    max-retries: #Number of times any operation on the source system will be re-attempted on failures.

    #ssl:
    #  trust-store: 
    #    enable: true
    #    path: "/home/informix/ssl/truststore.jks" #Path to the JKS truststore containing the trust certificate of the Informix server
    #    password: "in4mix" #The truststore password
    ```
    - You have to connect to the **syscdcv1** catalogue on the server as the user `informix` to be able to use Change Data Capture (CDC). The `informix-user-password` parameter of the config file above should have the password of user `informix`. For more information, see [Preparing to use the Change Data Capture API](https://www.ibm.com/docs/en/informix-servers/14.10?topic=api-preparing-use-change-data-capture) on IBM Informix Documentation.

    - You can use SSL to connect to the Informix server using the configuration parameters shown above. To konw about Informix server side SSL setup, see [Configuring Informix server instance for SSL connections](https://www.ibm.com/docs/en/informix-servers/14.10?topic=protocol-configuring-server-instance-secure-sockets-layer-connections) on IBM Informix Documentation.

## V. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the Extractor configuration file:
   ```BASH
   vi conf/src/informix.yaml
   ```
2. The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to realtime mode.

    ### Parameters related to snapshot mode
    For snapshot mode, make the necessary changes as follows:

    ```YAML
    snapshot:
      threads: 16
      fetch-size-rows: 5_000

    #  lock:
    #    enable: true
    #    scope: TABLE   # DATABASE, TABLE
    #    force: false
    #    timeout-sec: 5

    #  min-job-size-rows: 1_000_000
    #  max-jobs-per-chunk: 32

      split-method: MODULO  # Allowed values are RANGE, MODULO
      per-table-config:
      - catalog: "tpch"
        schema: "tpch"
        tables:
          lineitem:
            split-key: "l_orderkey"
    #       row-identifier-key: ["l_linenumber", "l_orderkey"]
    #       split-method : MODULO  # Table specific overridable config : allowed values are RANGE, MODULO
    #       num-jobs: 1
          orders:
            split-key: "o_orderkey"
    #       num-jobs: 1
    ```

    ### Parameters related to realtime mode
    For operating in realtime mode, use the `realtime` section to specify your configuration. The following parameters are specific to Informix:

    - `db-charset` *[v22.02.12.23]*: JDK equivalent of Informix code set. For example, UTF-8, ISO-8859-1 etc.
    - `start-position`: This parameter allows using user specified sequence number or timestamp to start reading Change Data Capture operations. 
      - `sequence-number`: Specifies the start position for the Change Data Capture.
      - `timestamp-ms`: Optional parameter. Used as a filter—any transaction with commit timestamp older than this is ignored. Should be used together with `sequence-number` for finer tuning.
      - `create-checkpoint`: `true` or `false`. If set to `true`, it does two things: 

        a. Obtains the current `sequence-number` from the Informix server and logs it in the `trace.log` file. The log has the following format: 
          ```
          Successfully created replication checkpoint at CDC sequence number: <seq_number>
          ```
        b. Sets up a *checkpoint*, from which you can resume the replication at any point.  You can do so by appending the `--resume` argument to the replication command that created the checkpoint.
    
    The following is a sample configuration for realtime mode:

    ```YAML
    realtime:
      threads: 4
      fetch-size-rows: 256
      _buffer-size: 1000
      _read-timeout: 3

      db-charset: UTF-8

      start-position:
      # create-checkpoint: false
      # sequence-number: 51553788137
      # timestamp-ms: 1647378865000

      heartbeat:
        enable: true
        catalog: tpch
        schema: tpch
        interval-ms: 10000
    ```

    {{< hint "info" >}}

  With Informix as Source, you have the option to use the Source Column Transformation feature of Replicant for the following pipelines:
  
  - Informix to PostgreSQL
  - Informix to Kafka
  
  For more information, see [Source Column Transformation]({{< ref "docs/sources/configuration-files/source-column-transformation" >}}).
  
    {{< /hint >}}

    #### Example of creating a checkpoint and resuming replication
    Let's assume you used the following command to start the replication, with your `realtime` configuration same as above:

    ```shell
    ./bin/replicant real-time conf/conn/informix.yaml conf/conn/postgresql.yaml \
    --filter filter/informix_filter.yaml \
    --extractor conf/src/informix.yaml \
    --replace
    ```

    In the `trace.log` file, you wil find the `sequence-number` corresponding to this replication job.

    With a valid `sequence-number` and `create-checkpoint` set to `true`, you can resume replication from the position of the most recently created checkpoint (which is the checkpoint you created via the previous command) in the following way:

    ```shell
    ./bin/replicant real-time conf/conn/informix.yaml conf/conn/postgresql.yaml \
    --filter filter/informix_filter.yaml \
    --extractor conf/src/informix.yaml \
    --replace --resume
    ```

For a detailed explanation of configuration parameters in the Extractor file, read [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").