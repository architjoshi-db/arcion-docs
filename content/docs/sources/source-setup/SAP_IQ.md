---
pageTitle: SAP IQ Source Connector Documentation
title: SAP IQ
description: "Get up to speed with SAP IQ's big data analytics on the Arcion platform."
url: docs/source-setup/sap_iq
bookHidden: false
---

# Source SAP IQ

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:

   ```BASH
   vi conf/conn/sapiq_src.yaml
   ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

   ```YAML
    type: SAP_IQ

    host: localhost
    port: 2638

    database: 'tpch'
    username: 'USERNAME'
    password: 'PASSWORD'

    max-connections: 30
    max-retries: 10
    retry-wait-duration-ms: 1000
    ```

    Replace the following:

    - *`USERNAME`*: the username to connect to the SAP IQ instance.
    - *`PASSWORD`*: the password associated with *`USERNAME`*.

## II. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the Extractor configuration file:
   ```BASH
   vi conf/src/sapiq_delta.yaml
   ```

2. The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to delta-snapshot mode.

    ### Parameters related to snapshot mode
    For snapshot mode, make the necessary changes as follows in the `snapshot` section of the configuration file:

    ```YAML
    snapshot:
      threads: 16
      fetch-size-rows: 10_000

      #_traceDBTasks: true
      min-job-size-rows: 1_000_000
      max-jobs-per-chunk: 32

      per-table-config:
        - catalog: tpch
    #      schema: public
          tables:
            lineitem:
              row-identifier-key: [l_orderkey, l_linenumber]
              split-key: l_orderkey
    #        split-hints:
    #          row-count-estimate: 15000
    #          split-key-min-value: 1
    #          split-key-max-value: 60_000
    ```

    ### Parameters related to delta-snapshot mode
    If you want to operate in delta-snapshot mode, you can use the `delta-snapshot` section to specify your configuration. For example:

    ```YAML
    delta-snapshot:
      threads: 16
      fetch-size-rows: 10_000

      delta-snapshot-key: ts
      _traceDBTasks: true
      min-job-size-rows: 1_000_000
      max-jobs-per-chunk: 32
      replicate-deletes: false

      per-table-config:
        - catalog: tpch
          tables:
            testTable:
              #        split-key: a  # Any numeric/timestamp column with sufficiently large number of distincts
              #        split-hints:
              #          row-count-estimate: 100000  # Estimated row count, if supplied replicant will leverage
              #          split-key-min-value: 1      #Lower bound of split key value
              #          split-key-max-value: 60_000 #Upper bound of split key value, if supplied replicant will leverage and avoid querying source database for the same
              delta-snapshot-key: a  # A monotonic increasing numeric/timestamp column which gets new value on each INSERT/UPDATE
              row-identifier-key: [a]   # A set of columns which uniquely identify a row
              update-key: [a]  # A set of columns which replicant should use to perform deletes/updates during incremental replication
            lineitem:
              row-identifier-key: [l_orderkey, l_linenumber]
    ```

For a detailed explanation of configuration parameters in the Extractor file, read [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").