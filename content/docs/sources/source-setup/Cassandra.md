---
pageTitle: Cassandra Source Connector Documentation
title: Cassandra
description: "Read step-by-step instructions on how to set up fast, CDC-based data pipelines from Cassandra Sources using Arcion Cassandra connector."
url: docs/source-setup/cassandra
bookHidden: false
---
# Source Cassandra

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory.

## CDC Prerequisites

Arcion Replicant supports two mechanisms for accessing the Cassandra CDC log files. The working method depends on whether the CDC log files are accessible locally to the Replicant.

1. If Replicant is running on the same node as the source Cassandra server or the Cassandra CDC log files are accessible to Replicant using NFS mount, then you must configure the access-method as LOCAL and provide the locations of cdc-log-dir and cdc-raw-dir in the connection configuration file (explained in step I).
   ```yaml
   cdc-log-config:
     access-method: LOCAL
     cdc-log-dir: '/var/lib/cassandra/commitlog'
     cdc-raw-dir: '/var/lib/cassandra/cdc_raw'
   ```

2. If Replicant is running on a different node than the source Cassandra server and the Cassandra CDC logs are not accessible to Replicant using NFS mount, then you must configure the access-method as SFTP, provide the locations of cdc-log-dir and cdc-raw-dir, and setup the SFTP coniguration in the connection configuration file (explained in step I).
   ```yaml
   cdc-log-config:
     access-method: SFTP
     cdc-log-dir: '/var/lib/cassandra/commitlog'
     cdc-raw-dir: '/var/lib/cassandra/cdc_raw'
     sftp-config:
       username: 'cassandra'
       password: 'cassandra'
       port: 22
   ```
**Steps to enable CDC Replication**
1. Enable the CDC logging for the desired tables by setting the cdc property of table to true when creating or altering the table:
   ```SQL
   CREATE TABLE foo (a int, b text, PRIMARY KEY(a)) WITH cdc=true;
   OR
   ALTER TABLE foo WITH cdc=true;
   ```

2. When Replicant is configured to use the SFTP access-method, the SFTP server should be running on the machine running the Cassandra node. If SFTP server is not present on the machine, it can be installed with the following commands:
   ```BASH
   sudo apt-get update
   sudo apt-get install openssh-server
   /etc/init.d/ssh start
   ```

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME` navigate to the connection configuration file:
    ```BASH
    vi conf/conn/cassadra.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
    ```YAML
    type: CASSANDRA

    cassandra-nodes:
      node1:
        host: 172.17.0.2
        port: 9042
        cdc-log-config:
          access-method: SFTP  # access-method can be LOCAL, SFTP
          cdc-log-dir: '/var/lib/cassandra/commitlog' # Enter the path of the directory containing Cassandra commit log
          cdc-raw-dir: '/var/lib/cassandra/cdc_raw' # Enter the path of the directory containing Cassandra CDC log

          #Only specify the following configurations if your access method is SFTP
          sftp-config:
            username: 'cassandra'
            password: 'cassandra'
            port: 22

      #If you are using multiple nodes, specify them in this section using the format above

    csv-load-connection:
      storage-location: /path/to/extracted/csvs
      access-method: LOCAL # access-method can be LOCAL, SFTP
      max-connections: 30
      sftp-config:
        username: 'cassandra' # if access-method is SFTP, provide sftp-username to log on to host using SFTP
        password: 'cassandra' # if access-method is SFTP, provide sftp-password to log on to host using SFTP
        port: 22 # if access-method is SFTP, provide port on which SFTP service is running

    username: 'cassandra'
    password: 'cassandra'

    read-consistency-level: LOCAL_QUORUM  #Enter one of the allowed values: ANY, ONE, TWO, THREE, QUORUM, ALL, LOCAL_QUORUM, EACH_QUORUM, SERIAL, LOCAL_SERIAL, LOCAL_ONE

    auth-type: "PlainTextAuthProvider" #Enter one of the allowed values: DsePlainTextAuthProvider, PlainTextAuthProvider

    max-connections: 30 #Maximum number of connections Replicant can open in Cassandra    
    ```
## II. Setup Filter Configuration

1. From `$REPLICANT_HOME` navigate to the filter configuration file:
    ```BASH
    vi filter/cassandra_filter.yaml
    ```

2. In accordance to your replication needs, specify the data which is to be replicated. Use the format of the below explained example:

    ```yaml
    allow:
      #In this example, data of object type Table in the schema tpch will be replicated
      schema: "tpch"
      types: [TABLE]

      #From schema tpch, only the lineitem, ORDERS, and usertable tables will be replicated.
      #Note: Unless specified, all tables in the catalog will be replicated
      allow:
        lineitem:
        #Within lineitem, only the item_one and item_two columns will be replicated
        allow: ["item_one, item_two"]

        ORDERS:  
          #Within ORDERS, only the test_one and test_two columns will be replicated as long as they meet the condition "o_orderkey < 5000"
          allow: ["test_one", "test_two"]
          conditions: "o_orderkey <5000"

        usertable: #All columns in the table usertable will be replicated without any predicates
      ```

      The following is a template of the format you must follow:

      ```YAML
      allow:
        schema: <your_schema_name>
        types: <your_object_type>


        allow:        
          your_table_name_1:  
             allow: ["your_column_name"]
             conditions: "your_condition"

          your_table_name_2:

          your_table_name_3:
            allow: ["your_column_name"]
            conditions: "your_condition"         
      ```
For a detailed explanation of configuration parameters in the filter file, read: [Filter Reference]({{< ref "../configuration-files/filter-reference" >}} "Filter Reference")

## III. Set up Extractor Configuration

For real-time replication, you must create a heartbeat table in the source Cassandra.

1. Create a heartbeat table in the catalog you are going to replicate with the following DDL:
   ```SQL
   CREATE TABLE "<user_keyspace>"."replicate_io_cdc_heartbeat"("timestamp" BIGINT, PRIMARY KEY("timestamp"));
   ```

2. Grant ```INSERT```, ```UPDATE```, and ```DELETE``` privileges to the user configured for replication.

3. From `$REPLICANT_HOME` navigate to the extractor configuration file:
   ```BASH
   vi conf/src/cassandra.yaml
   ```

4. If required, make the necessary changes as follows:
    ```YAML
    snapshot:
       extraction-method: CSVLOAD #Allowed values are QUERY, CSVLOAD
       native-extract-options:
         control-chars:
           delimiter: ','
           quote: '"'
           escape: "\u0000"
           null-string: "NULL"
           line-end: "\n"

    realtime:
      heartbeat:
        enable: true
        table-name [20.09.14.3]: replicate_io_cdc_heartbeat #Heartbeat table name if changed
        column-name [20.10.07.9]: timestamp #Heartbeat table column name if changed
    ```
## Limitations

The following limitations will apply when replicating from Cassandra as a source:

1. Replication of counter tables is not supported.
2. Changes resulted from any of these features are ignored:
   * TTL on collection-type columns
   * Range deletes
   * Static columns
   * Triggers
   * Secondary indices
   * Light-weight transactions
3. Unsupported Datatypes:
   * map
   * set

**Note**: The operation(Insert/Update/Delete) count during real-time replication will be displayed on the dashboard as (number of operations)*(number of replication factors).
