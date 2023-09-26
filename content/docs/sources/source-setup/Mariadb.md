---
pageTitle: MariaDB Source Connector Documentation
title: MariaDB
description: "Get detailed guide on how to set up MariaDB as data Source on Arcion platform for your data pipelines."
url: docs/source-setup/mariadb
bookHidden: false
---

# Source MariaDB Database

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory.

## I. Install mysqlbinlog utility on Replicant Host

Install a compatible `mysqlbinlog` utility (compatible with the source MySQL server) on the machine where Replicant will be running. The easiest way to install the correct version of `mysqlbinlog` is to install the the the same MySQL server version as your source MySQL System. After installation, you can stop the running  MySQL server on Replicant host using the following command:

  ```BASH
  sudo systemctl stop mysql
  ```

## II. Enable binary logging in MariaDB server

1. Open the MariaDB option file `var/lib/my.cnf` (create the file if it doesn't already exist). Add the following lines in the file:

    ```SHELL
    [mysqld]
    log-bin=mysql-log.bin
    binlog_format=ROW
    ```
    The first line [enables binary logging and specifies the filename to write the logs to](https://mariadb.com/kb/en/replication-and-binary-log-system-variables/#log_bin). The second line [sets the binary logging format](https://mariadb.com/docs/skysql/ref/mdb/system-variables/binlog_format/).

2. Export the `$MYSQL_HOME` path with the following command:

    ```SHELL
    export MYSQL_HOME=/var/lib/mysql
    ```

3. Restart MySQL with the following command:
    ```BASH
    sudo systemctl restart mysql
    ```
4. Verify if binary logging is turned on with the following command:
    ```BASH
    mysql -u root -p
    ```
    ```SQL
    MariaDB [(none)]> show variables like "%log_bin%";
    +---------------------------------+--------------------------------+
    | Variable_name                   | Value                          |
    +---------------------------------+--------------------------------+
    | log_bin                         | ON                             |
    | log_bin_basename                | /var/lib/mysql/mysql-bin       |
    | log_bin_compress                | OFF                            |
    | log_bin_compress_min_len        | 256                            |
    | log_bin_index                   | /var/lib/mysql/mysql-bin.index |
    | log_bin_trust_function_creators | OFF                            |
    | sql_log_bin                     | ON                             |
    +---------------------------------+--------------------------------+
    7 rows in set (0.011 sec)
    ```

## III. Set up MySQL user for Replicant
1.	Create MySQL user:
    ```SQL
    CREATE USER 'username'@'replicate_host' IDENTIFIED BY 'password';
    ```
    
2.	Grant the following privileges on all tables involved in replication:
    ```SQL
    GRANT SELECT ON "<user_database>"."<table_name>" TO 'username'@'replicate_host';
    ```

3.	Grant the following Replication privileges:
    ```SQL
    GRANT REPLICATION CLIENT ON *.* TO 'username'@'replicate_host';
    GRANT REPLICATION SLAVE ON *.* TO 'username'@'replicate_host';
    ```

4.	Verify if created user can access binary logs:
    ```SQL
    MariaDB [(none)]> show binary logs;
    +------------------+-----------+
    | Log_name         | File_size |
    +------------------+-----------+
    | mysql-bin.000001 |       351 |
    | mysql-bin.000002 |      4635 |
    | mysql-bin.000003 |       628 |
    | mysql-bin.000004 | 195038185 |
    +------------------+-----------+
    4 rows in set (0.001 sec)
    ```

## IV. Set up Connection Configuration

1. From ```$REPLICANT_HOME```, navigate to the connection configuration file:
    ```BASH
    vi conf/conn/mariadb_src.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
    ```YAML
    type: MARIADB

    host: HOSTNAME
    port: PORT_NUMBER

    username: "USERNAME"
    password: "PASSWORD"

    slave-server-ids: [1]
    max-connections: 30 #Maximum number of connections replicant can open in MariaDB
    ```

    Replace the following:
    - *`HOSTNAME`*: the hostname of your MariaDB host
    - *`PORT_NUMBER`*: the port number of the host
    - *`USERNAME`*: a valid username that connects to your MariaDB server
    - *`PASSWORD`*: the password associated with *`USERNAME`*.

## V. Set up Filter Configuration

1. From ```$REPLICANT_HOME```, navigate to the filter configuration file:
    ```BASH
    vi filter/mariadb_filter.yaml
    ```

2. According to your replication needs, specify the data that you need to replicate. Use the format of the following example:  

    ```yaml
    allow:
      catalog: "tpch"
      types: [TABLE]

      allow:
        NATION:
        allow: ["US, AUS"]

        ORDERS:  
          allow: ["product", "service"]
          conditions: "o_orderkey < 5000"

        PART:
      ```
      
      The preceding sample consists of the following elements:

      - Data of object type `TABLE` in the catalog `tpch` will be replicated.
      - From database `tpch`, only the `NATION`, `ORDERS`, and `PART` tables will be replicated. If you don't specify anything, all tables will be replicated.
      - Within `NATION`, only the `US` and `AUS` columns will be replicated.
      - From the `ORDERS` table, only the `product` and `service` columns will be replicated as long as they meet the condition you specified in `conditions`.
      - Since the `PART` column doesn't specify any table, all of its tables will be replicated.

      The preceding sample follows the followig generic format. You must adhere to this format for specifying your filters.

      ```YAML
      allow:
        catalog: <your_catalog_name>
        types: <your_object_type>

        allow:
          <your_table_name>:
             allow: ["your_column_name"]
             conditions: "your_condition"

          <your_table_name>:  
             allow: ["your_column_name"]
             conditions: "your_condition"

          <your_table_name>:         
      ```
For a detailed explanation of configuration parameters in the filter file, see [Filter Reference]({{< ref "../configuration-files/filter-reference" >}} "Filter Reference").

## VI. Create heartbeat table

For real-time replication,  you must create a heartbeat table in the source MariaDB. This ensures an accurate computation of latency. To create a heartbeat table, follow these steps:

1. Create a heartbeat table in the catalog/schema you are going to replicate with the following DDL:
   ```SQL
    CREATE TABLE `<user_database>`.`replicate_io_cdc_heartbeat`(
      timestamp BIGINT NOT NULL,
      PRIMARY KEY(timestamp));
    ```
    Replace `<user_database>` with the name of your specific database.

2. Grant ```INSERT```, ```UPDATE```, and ```DELETE``` privileges on the heartbeat table to the user configured for replication.

## VII. Set up Extractor configuration

1. From ```$REPLICANT_HOME```, navigate to the Extractor configuration file:
   ```BASH
   vi conf/src/mariadb.yaml
   ```

2. The Extractor configuration file has two parts:
   
   - Parameters related to snapshot mode.
   - Parameters related to realtime mode.

    ### Parameters related to snapshot mode
    For snapshot mode, the following is a sample configuration:

    ```YAML
    snapshot:
      threads: 16
      fetch-size-rows: 15_000

      per-table-config:
      - catalog: tpch
        tables:
          ORDERS:
            num-jobs: 1
          LINEITEM:
            row-identifier-key: [L_ORDERKEY]
            split-key: l_orderkey
    ```

    ### Parameters related to realtime mode
    For operating in realtime mode, define your configurations in the `realtime` section of the configuration file. The following is a sample:
    
      ```YAML
      realtime:
        heartbeat:
          enable: true
          catalog: "tpch" #Replace tpch with your database name
          table-name: replicate_io_cdc_heartbeat #Replace replicate_io_cdc_heartbeat with your heartbeat table's name if applicable
          column-name: timestamp #Replace timestamp with your heartbeat table's column name if applicable
      ```

For a detailed explanation of configuration parameters in the extractor file, see [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").
