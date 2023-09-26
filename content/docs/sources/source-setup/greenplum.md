---
pageTitle: Greenplum Source Connector Documentation
title: Greenplum
description: "Read the setup instructions for streaming data from Greenplum Source, the analytics Postgres database."
url: docs/source-setup/greenplum
bookHidden: false
---
# Source Greenplum

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:
    ```BASH
    vi conf/conn/greenplum.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: GREENPLUM

    host: HOSTNAME
    port: PORT_NUMBER

    database: 'DATABASE_NAME'
    username: 'USERNAME'
    password: 'PASSWORD'

    max-connections: 30
    socket-timeout-s: 60

    max-retries: 10
    retry-wait-duration-ms: 1000
    ```

    Replace the following:
    - *`HOSTNAME`*: the hostname of your Greenplum host
    - *`PORT_NUMBER`*: the relevant port number of the Greenplum cluster
    - *`DATABASE_NAME`*: the name of the Greenplum database
    - *`USERNAME`*: the Greenplum database role name to connect as
    - *`PASSWORD`*: the password associated with *`USERNAME`*

## II. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the Extractor configuration file:
    ```BASH
    vi conf/src/greenplum.yaml
    ```
2. The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to delta snapshot mode.

    ### Parameters related to snapshot mode
    For snapshot mode, you can make use of the following sample:

      ```YAML
      snapshot:
        threads: 32
        fetch-size-rows: 10_000

        min-job-size-rows: 1_000_000
        max-jobs-per-chunk: 32
        _traceDBTasks: true

        lock:
          enable: false

        per-table-config:
          - catalog: tpch
            schema: public
            tables:
              lineitem:
                row-identifier-key: [l_orderkey, l_linenumber]
                split-key: l_orderkey
              split-hints:
                row-count-estimate: 15000
                split-key-min-value: 1
                split-key-max-value: 60_000
      ```
      {{< hint "warning" >}}
  - In the absence of a `split-key`, we use a generated key `gp_segment_id` for tables. This allows Replicant to split a table into multiple jobs, increasing parallelism.
  - In case of views or any other non-table object type, we don't support extraction using generated key. Replicant honors `split-key` only if the user explicitly provides it in the Extractor configuration file.
    {{< /hint >}}

      - If you want to enable objecting locking, you can do so by setting the `enable` field of `lock` to `true` and providing the locking details in the following way:

        ```YAML
        lock:
          enable: {true|false}
          scope: {TABLE|DATABASE} 
          force: {true|false}
          timeout-sec: TIMEOUT_IN_SECONDS
        ```

        Replace *`TIMEOUT_IN_SECONDS`* with the number of seconds you want the locking timeout to be—for example, `5`.

      - To specify extraction method for Source Greenplum, set the parameter `extraction-method` to any of the following two extraction methods:
        - `QUERY`
        - `COPY`.

      - You can also specify details for native extraction method—for example the type of compression to use. For Source Greenplum, Arcion currently supports only the `GZIP` compression type, which generates extracted files in compressed `.gz` format. Notice the following sample:

        ```YAML
        extraction-method: COPY
        native-extract-options:
          compression-type: "GZIP"
        ```

        {{< hint "warning" >}} **Important:** Use `GZIP` as the `compression-type` only when you've set the `extraction-method` to `COPY`. Otherwise, set `compression-type` to `NONE`. {{< /hint >}}
      
      - You can also choose to specify the `extraction-method` and `native-extract-options` parameters in the `per-table-config` section to more finely tune your table-specific requirements. For example:

        ```YAML
          per-table-config:
          - catalog: tpch
            schema: public
            tables:
              lineitem:
                extraction-method: QUERY 
                native-extract-options:
                  compression-type: "NONE"
          ```
 
    ### Parameters related to delta snapshot mode
    If you want to operate in delta snapshot mode, you can use the `delta-snapshot` section to specify your configuration. For example:

    ```YAML
    delta-snapshot:

      threads: 32
      fetch-size-rows: 10_000

      min-job-size-rows: 1_000_000
      max-jobs-per-chunk: 32

      delta-snapshot-key: last_update_time
      delta-snapshot-interval: 10
      delta-snapshot-delete-interval: 10
      _traceDBTasks: true
      #replicate-deletes: false

      per-table-config:
      - catalog: tpch
        schema: public
        tables:
          part:
            delta-snapshot-key: last_update_time
          lineitem:
            delta-snapshot-key: last_update_time
            row-identifier-key: [l_orderkey, l_linenumber]
    ```

    - To specify extraction method, set the parameter `extraction-method` to any of the following two extraction methods:
        - `QUERY`
        - `COPY`.

    - You can also specify details for native extraction method—for example the type of compression to use. For Source Greenplum, Arcion currently supports only the `GZIP` compression type, which generates extracted files in compressed `.gz` format. Notice the following sample:

      ```YAML
      extraction-method: COPY
      native-extract-options:
        compression-type: "GZIP"
      ```

      {{< hint "warning" >}} **Important:** Use `GZIP` as the `compression-type` only when you've set `extraction-method` to `COPY`. Otherwise, set `compression-type` to `NONE`. {{< /hint >}}
    
    - You can also choose to specify the `extraction-method` and `native-extract-options` parameters in the `per-table-config` section to more finely tune your table-specific requirements. For example:

      ```YAML
      per-table-config:
        - catalog: tpch
          schema: public
          tables:
           testTable:
             split-key: split-key-column
             delta-snapshot-key: delta-snapshot-key-column
             delta-snapshot-key-offset: '2019-10-05 13:23:45.890000'
             extraction-method: QUERY
             native-extract-options:
               compression-type: "NONE"
      ```

      In the sample above, the `delta-snapshot-key-offset` parameter indicates the delta snapshot key to start replication from.

For a detailed explanation of configuration parameters in the Extractor file, see [Extractor Reference]({{< ref "../configuration-files/Extractor-reference" >}} "Extractor Reference").