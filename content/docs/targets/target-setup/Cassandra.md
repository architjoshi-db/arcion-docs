---
pageTitle: Cassandra Target Connector Documentation
title: Cassandra
description: "Learn all the conifgurations for fast data ingestion into your Cassandra databases, with support for bulk loading."
url: docs/target-setup/cassandra
bookHidden: false
---
# Destination Cassandra

## I. Setup Connection Configuration

1. From ```HOME```, navigate to the sample connection configuration file:
    ```BASH
    vi conf/conn/cassandra.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: CASSANDRA

    #You can specify multiple Cassandra nodes using the format below:
    cassandra-nodes:
      node1: #Replace node1 with your node name
        host: 172.17.0.2 #Replace 172.17.0.2 with your node's host
        port: 9042 #Replace 9042 with your node's port
      node2: #Replace node2 with your node name
        host: 172.17.0.3 #Replace 172.17.0.3 with your node's host
        port: 9043 #Replace 9042 with your node's port

    username: 'cassandra' #Replace cassandra with your username that connects to your Cassandra server
    password: 'cassandra' #Replace 'cassandra' with your user's password

    read-consistency-level: LOCAL_QUORUM  #Allowed values: ANY, ONE, TWO, THREE, QUORUM, ALL, LOCAL_QUORUM, EACH_QUORUM, SERIAL, LOCAL_SERIAL, LOCAL_ONE

    auth-type: "PlainTextAuthProvider" #Allowed values: DsePlainTextAuthProvider, PlainTextAuthProvider

    max-connections: 30 #Specify the maximum number of connections Replicant can open in Cassandra
    max-requests-per-connection: #Specify the max number of requests each connection will handle in parallel.
    max-request-queue-size: #Specify the ,ax queue size to enqueue requests while all connections are busy. If more than the max-queue-size request get queued, then driver throws BusyPoolException.
    pool-timeout-ms: #Specify the time in ms, after which driver throws BusyPoolException, if all connections are busy serving max requests.
    ```


## II. Setup Applier Configuration

If you want to change the table definitions in destination Cassandra, change the applier configurations with the proceeding steps:  

1. From ```HOME```, navigate to the Applier Configuration File:
   ```BASH
    vi conf/dst/cassandra.yaml
    ```

2. Make the necessary changes as follows:

    ```YAML
    snapshot:
      threads: 32 #Specify the maximum number of threads Replicant should use for writing to the target

      batch-size-rows: 100
      #transaction-size-rows: 1_000_000
      skip-tables-on-failures : true
      _traceDBTasks: true

      keyspaces:
        tpch:
          replication-property: "{'class' : 'SimpleStrategy' , 'replication_factor' : 1}"
          durable-writes: true

      bulk-load:
        enable: true|false #Set to true if you want to enable bulk loading
        type: FILE
        serialize: true|false #Set to true if you want the generated files to be applied in serial/parallel fashion

        #For versions 20.09.14.3 and beyond
        native-load-configs: #Specify the user-provided LOAD configuration string which will be appended to the s3 specific LOAD SQL command

    ```
