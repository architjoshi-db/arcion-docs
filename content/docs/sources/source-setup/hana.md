---
pageTitle: SAP HANA Source Connector Documentation
title: SAP HANA
description: "Arcion supports SAP HANA as data Source. Connect using native JDBC client and tune Extractor parameters to suit your requirements."
url: docs/source-setup/hana
bookHidden: false
---

# Source SAP HANA

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory.

## I. Download HANA JDBC Client

Please download the SAP HANA JDBC Client from [SAP Development Tools](https://tools.hana.ondemand.com/#hanatools) and copy it in the `$REPLICANT_HOME/lib` directory.

## II. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the connection configuration file:
    ```BASH
    vi conf/conn/hana.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
    ```YAML
    type: HANA

    host: localhost #Hostname of the HANA server
    port: 39041 #Port number of the HANA server

    username: SYSTEM #Username to connect to the server. 
    password: Replicant#123 #User password

    url: #Optional parameter. Represents the exact URL to be used by the JDBC driver to connect to the source.

    max-connections: 30 #Maximum number of connections Replicant would use to fetch data from source Hana.
    max-retries: #Number of times any operation on the source system will be re-attempted on failures.
    retry-wait-duration-ms: #Duration in milliseconds Replicant should wait before performing then next retry of a failed operation.
    ```

    - Make sure the user has read access on all the databases/schemas/tables that are to be replicated.
    - If you include the `url` parameter in the connection configuration file, do not specify any of the `host`, `port`, `username`, and `password` parameters separately as the URL should be containing all the details.

## III. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the sample Extractor configuration file:
   ```BASH
   vi conf/src/hana.yaml
   ```
    a. For snapshot mode, make the necessary changes as follows in the `snapshot` section of the configuration file:

    ```YAML
    snapshot:
      threads: 16
      fetch-size-rows: 5_000
      split-key: $rowid$

    #  min-job-size-rows: 1_000_000
    #  max-jobs-per-chunk: 32
      ```

    b. For delta snapshot mode, make the necessary changes as follows in the `delta-snapshot` section of the configuration file:

    ```YAML
    delta-snapshot:
      threads: 16
      fetch-size-rows: 5_000

    # min-job-size-rows: 1_000_000
    # max-jobs-per-chunk: 32
    # _max-delete-jobs-per-chunk: 32

    # delta-snapshot-interval: 10
    # replicate-deletes: true
    # split-key: $rowid$
    # delta-snapshot-key: $rowid$
    # row-identifier-key: [$rowid$]

      per-table-config:
      - schema: tpch
        tables:
    #      testTable:
    #        split-key: split-key-column  # Any numeric/timestamp column with sufficiently large number of distincts
    #        split-hints:
    #          row-count-estimate: 100000  # Estimated row count
    #          split-key-min-value: 1      # Lower bound of split key value
    #          split-key-max-value: 60_000 # Upper bound of split key value, if specified Replicant will leverage and avoid querying source database for the same
    #        delta-snapshot-key: delta-snapshot-key-column  # A monotonic increasing numeric/timestamp column which gets new value on each INSERT/UPDATE
    #        row-identifier-key: [col1, col2]   # A set of columns which uniquely identify a row
    #        update-key: [col1, col2]  # A set of columns which Replicant should use to perform deletes/updates during incremental replication
          partsupp:
            row-identifier-key: [$rowid$]
          customer:
            split-key: custkey
            row-identifier-key: [$rowid$]
    ```
  
    {{< hint "info" >}} `delta-snapshot-key` is only needed for Hana Row store tables. Column store tables are handled automatically, even if `delta-snaphot-key` is not specified. If specified, it will get preference over system-generated key. {{< /hint >}}

 For a detailed explanation of configuration parameters in the extractor file, read [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").