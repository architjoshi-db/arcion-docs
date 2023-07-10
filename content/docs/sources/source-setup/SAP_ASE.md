---
pageTitle: SAP ASE Source Connector Documentation
title: SAP ASE
description: "Learn how to extract data from Source SAP ASE database with Arcion, with support for ASE's bcp utility for faster, native data extraction."
url: docs/source-setup/sap_ase
bookHidden: false
---

# Source SAP ASE (Sybase ASE)

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## I. Set up connection configuration
Specify our ASE connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `sybasease_src.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

For connecting to ASE, you can choose between two methods for an authenticated connection:
  - Using basic username and password authentication
  - Using SSL

### Connect with username and password
For connecting to SAP ASE with basic username and password authentication, you have the following two options:

{{< tabs "username-pwd-auth" >}}
{{< tab "Specify credentials in plain text" >}}
You can specify your credentials in plain YAML in the connection configuration file like the following sample:

```YAML
type: SYBASE_ASE

host: HOSTNAME
port: PORT_NUMBER

database: 'DATABASE_NAME'
username: 'USERNAME'
password: 'PASSWORD'

max-connections: 20
max-retries: 10
retry-wait-duration-ms: 1000
```

Replace the following:

- *`HOSTNAME`*: hostname of the SAP ASE server
- *`PORT_NUMBER`*: port number of the SAP ASE server
- *`DATABASE`*: the name of the SAP ASE database to connect to
- *`USERNAME`*: the username of the *`DATABASE`* user
- *`PASSWORD`*: the password associated with *`USERNAME`*

If you want to use [the `bcp` utility](https://help.sap.com/docs/SAP_ASE/da6c1d172bef4597a78dc5e81a9bb947/a80af36ebc2b1014adabde105795cc5b.html?version=16.0.3.8) to extract data from your source ASE, you need specify some additional parameters in the connection configuration file. For more information, see [Use `bcp` Utility for Extraction](#use-bcp-utility-for-extraction).

{{< /tab >}}
{{< tab "Fetch credentials from AWS Secrets Manager" >}}
If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}).
{{< /tab >}}
{{< /tabs >}}

### Connect using SSL
To connect to ASE using SSL, simply enable SSL in Replicant's connection configuration file:

```YAML
ssl:
  enable: true
```

If you want to add certificate to other KeyStore, specify the KeyStore's location in the connection configuration:

```YAML
ssl:
  enable: true
  trust-store:
    path: "PATH_TO_TRUSTSTORE"
    password: "TRUSTSTORE_PASSWORD"
    ssl-store-type: 'TRUSTSTORE_TYPE'
  key-store:
    path: "PATH_TO_KEYSTORE"
    password: "KEYSTORE_PASSWORD"
```

Replace the following:
- *`PATH_TO_TRUSTSTORE`*: path to the TrustStore
- *`TRUSTSTORE_PASSWORD`*: the TrustStore password
- *`TRUSTSTORE_TYPE`*: the TrustStore type—for example, `JKS`, `PKCS12`
- *`PATH_TO_KEYSTORE`*: path to the KeyStore
- *`KEYSTORE_PASSWORD`*: the KeyStore password

## II. Set up Extractor configuration

1. From `$REPLICANT_HOME`, navigate to the Extractor configuration file:

    ```BASH
    vi conf/src/sybasease.yaml
    ```

2. Arcion supports both [snapshot](#use-snapshot-mode) and [realtime](#use-realtime-mode) modes for SAP ASE. For more information, see the following two sections:

     ### Use snapshot mode
     For operating in snapshot mode, you can make changes under the `snapshot` section of the configuration file. Below is a sample:

      ```YAML
      snapshot:
        threads: 32
        fetch-size-rows: 10_000

        min-job-size-rows: 1_000_000
        max-jobs-per-chunk: 32

        extraction-method: {BCP|QUERY}

        per-table-config:
          - schema: tpch
            tables:
              partsupp:
                split-key: ps_partkey
              supplier:
                split-key: s_suppkey
              orders:
                split-key: o_orderkey
                nation:
                split-key: n_regionkey
      ```

      The `extraction-method` parameter specifies what extraction method to use to extract data from Source ASE. You can set it to any of the following two values:
      
      - `BCP`: With this Replicant will use [ASE's `bcp` utility](https://help.sap.com/docs/SAP_ASE/da6c1d172bef4597a78dc5e81a9bb947/a80af36ebc2b1014adabde105795cc5b.html?version=16.0.3.8) to extract data. For more information, see [Use `bcp` Utility for Extraction](#use-bcp-utility-for-extraction).
      - `QUERY`: Replicant will use JDBC connection to extract the data.

        *Default: By default, Replicant will use the `QUERY` method for extraction.*

        {{< hint "warning" >}} **Important:** When using `BCP` as the extraction method with filters, or `split-key` in Extractor configuration, make sure that the Replicant user has access privilege to create views in data schema. {{< /hint >}}

      ### Use realtime mode
      First, make sure that the ASE account [you specified in the Replicant connection configuration file](#i-set-up-connection-configuration) has [the following permissions granted](https://infocenter.sybase.com/help/index.jsp?topic=/com.sybase.infocenter.dc01672.1572/html/sec_admin/sec_admin136.htm):

      - `sa_role`
      - `replication_role`
      - `sybase_ts_role`
      
      After that, you can specify extraction parameters under the `realtime` section of the configuration file. Below is a working sample:

      ```YAML
      realtime:
        threads: 1
        fetch-size-rows: 100000
        fetch-interval-s: 10
        _traceDBTasks: true
        heartbeat:
          enable: true
          catalog: tpch
          schema: blitzz
          interval-ms: 10000
      ```

    {{< hint "warning" >}}
  **Important:** The `fetch-interval-s` parameter determines interval between each CDC fetch cycle. Always make sure to keep its value above or equal to `10`. For more information, see [Limitations](#limitations).
    {{< /hint >}}

    #### Limitations
    - You can run only one Extractor thread for each SAP ASE database. You can run multiple snapshot tasks in parallel.
    - DDL Replication isn't supported.
    - Running Merge operations during CDC will result in a non-recoverable error. To bring the Target back in sync, you'll need to run reinit or full snapshot again.
    - View Replication is not supported for realtime but possible for snapshot.
    - In order to avoid clogging source database, we need to set `fetch-interval-s` to a value greater than or equal to `10` seconds. This will pause the Extractor thread for `fetch-interval-s` seconds before extracting the next batch of logs.
    - It's not possible to manually reset truncation point.

For a detailed explanation of configuration parameters in the Extractor file, read [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").

## Use `bcp` utility for extraction

{{< hint "info" >}}
**Note:** `bcp` is only supported for snapshot mode.
{{< /hint >}}

You can configure Replicant to use the `bcp` (bulk copy program) utility for extracting data from your Source ASE. To do so, follow the steps below:

### Specify connection details
In your [SAP ASE connection configuration file](#i-set-up-connection-configuration), specify the `bcp` connection details under a new field `bcp-connection`:

```YAML
bcp-connection:
  host: HOSTNAME
  port: PORT_NUMBER
  username: 'USERNAME'
  password: 'PASSWORD'
  sybase-dir: 'SYBASE_SETUP_DIRECTORY'
  ocs-dir-name: 'OCS_DIRECTORY_NAME'
```

Replace the following:

- *`HOSTNAME`*: hostname of the SAP ASE server
- *`PORT_NUMBER`*: port number of the SAP ASE server
- *`USERNAME`*: the username of the ASE database user
- *`PASSWORD`*: the password associated with *`USERNAME`*
- *`SYBASE_SETUP_DIRECTORY`*: the absolute path for Sybase setup directory on Replicant machine
- *`OCS_DIRECTORY_NAME`*: the OCS directory name that is inside your Sybase setup directory

### Specify the extraction method in Extractor configuration file
In your [SAP ASE Extractor configuration file](#ii-set-up-extractor-configuration), set the value of `extraction-method` to `BCP`. This tells Replicant to use [ASE's `bcp` utility](https://help.sap.com/docs/SAP_ASE/da6c1d172bef4597a78dc5e81a9bb947/a80af36ebc2b1014adabde105795cc5b.html?version=16.0.3.8) for extraction.

{{< hint "warning" >}} **Important:** When using `BCP` as the extraction method with filters, or `split-key` in Extractor configuration, make sure that the Replicant user has access privilege to create views in data schema. {{< /hint >}}

