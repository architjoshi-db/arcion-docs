---
pageTitle: Set up Imply as data Target
title: Imply
description: "Get high-performance and high-volume data streaming into Imply and ensure faster feedback from the real-time analytics database."
url: docs/target-setup/imply
bookHidden: false
---

# Destination Imply

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

{{< hint "info" >}}
When using Imply as target, Arcion adds two new columns to table from its side:
- `OP_TYPE`: Means operation type. For snapshot, it will always will be `I`. For delete and update, it's `D` and `U`. This is necessary to carry out CDC. 
- `VER_COL`: This column contains a monotonically increasing value for each row. Since every table doesn't have a primary key, these values help distinguish different rows.
{{< /hint >}}

## I. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:

   ```sh
   vi conf/conn/imply.yaml
   ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

   ```yaml
   type: IMPLY
   
   accountName: <YOUR_ACCOUNT_NAME>
   url: <IMPLY_BASE_URL>
   clientId: <YOUR_CLIENT_ID>
   clientSecret: <YOUR_CLIENT_SECRET>
   file-format: JSON
   wait-poll-duration: <YOUR_PREFERRED_VALUE> #this will number of seconds used when polling on imnply async http calls"
   ```

## II. Set up Applier Configuration

1. From `$REPLICANT_HOME`, navigate to the sample Applier configuration file:

   ```BASH
   vi conf/dst/imply.yaml
   ```

2.  The configuration file has two parts:

    - Parameters related to snapshot mode.
    - Parameters related to realtime mode.

    ### Parameters related to snapshot mode
    For snapshot mode, you can use the following sample configuration:

     ```yaml
     snapshot:
       threads: 4
       txn-size-rows: 1000000
       _traceDBTasks: true
       _optimizedSnapshot: true
     ```
    
    ### Parameters related to realtime mode
    For operating in realtime mode, you can use the following sample configuration:
    ```yaml
    realtime:
      threads: 4
      txn-size-rows: 1000000
      _traceDBTasks: true
    ```

   For a detailed explanation of configuration parameters in the applier file, read [Applier Reference]({{< ref "../configuration-files/applier-reference" >}} "Applier Reference").