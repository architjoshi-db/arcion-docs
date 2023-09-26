---
pageTitle: Load data into IBM Informix
title: IBM Informix
description: "Get in-depth documentation on how to set up IBM Informix as data Target with Arcion, from setting up secure connection to enabling CDC-based replication."
url: docs/target-setup/informix
bookHidden: false
---
# Destination IBM Informix

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up Connection Configuration

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
    password: 'in4mix'  #Replace in4mix with your user's password  
    informix-user-password: 'in4mix' #Password for user "informix"

    lock-wait-duration: -1  # -1 will wait until lock is released, to use a timeout set a positive number of seconds

    #ssl:
    #  trust-store: 
    #    path: "/home/informix/ssl/truststore.jks" #Path to the JKS truststore containing the trust certificate of the Informix server
    #    password: "in4mix" #The truststore password

    max-connections: 15 #Maximum number of connections Replicant can open in Informix
    ```
    You have to connect to the **syscdcv1** catalogue on the server as the user `informix` to be able to use Change Data Capture. The `informix-user-password` parameter of the config file above should have the password of user `informix`. For more information, see [Preparing to use the Change Data Capture API](https://www.ibm.com/docs/en/informix-servers/14.10?topic=api-preparing-use-change-data-capture) on IBM Informix Documentation.

## II. Setup Applier Configuration

1. From `$REPLICANT_HOME`, navigate to the applier configuration file:
    ```BASH
    vi conf/dst/informix.yaml
    ```
2. Make the necessary changes as follows:

    ```YAML
    snapshot:
      threads: 16
      
      #use-raw-tables: false 

      #batch-size-rows: 5_000
      #txn-size-rows: 1_000

      #sbspace: 'specific_sbspace'
      #dbspace: 'specific_dbspace'
    ```
    The `use-raw-tables` parameter tells replicant [the type of Informix tables](https://www.ibm.com/docs/en/informix-servers/12.10?topic=storage-table-types-informix) to use for the destination. Setting it to `true` tells Replicant to perform the following to the destination tables:

    * Remove constraints like primary-key constraints, unique constraints, and referential constraints.
    * Change the destination tables to type [RAW (non-logging)](https://www.ibm.com/docs/en/informix-servers/12.10?topic=informix-raw-tables). This improves bulk load performance. Once loading is complete, Replicant converts the tables back to [STANDARD type](https://www.ibm.com/docs/en/informix-servers/12.10?topic=informix-standard-permanent-tables) and reinforces the constraints.

    You can also specify *dbspace* and *sbspace* for the destination by using the `sbspace` and `dbspace` parameters respectively.

3. If you want to operate in realtime mode, you can make use of the following parameters:

    ```YAML
    realtime:
      threads: 16
      #txn-size-rows: 10_000
      #batch-size-rows: 1000

    # Transactional mode config
    # realtime:
    #   threads: 1
    #   batch-size-rows: 1000
    #   replay-consistency: GLOBAL
    #   txn-group-count: 100
    #   _oper-queue-size-rows: 20000
    #   skip-upto-cursors: #last failed cursor

    ```

For a detailed explanation of configuration parameters in the applier file, read [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").