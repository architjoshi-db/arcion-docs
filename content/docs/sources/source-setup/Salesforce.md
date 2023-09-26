---
pageTitle: Salesforce Source Connector Documentation
title: Salesforce
description: "Arcion can help you get more growth out of Salesforce's CRM. Add Replicant as a Connected App, connect, and mobilize Salesforce data for all of your needs."
url: docs/source-setup/salesforce
bookHidden: false
---
# Source Salesforce

The extracted `replicant-cli` will be referred to as the `$REPLICANT_HOME` directory in the proceeding steps.

## I. Add Replicant to Salesforce as a Connected App

Before you can use Replicant with Salesforce, you have to add it to Salesforce as a [Connected App](https://help.salesforce.com/s/articleView?id=sf.connected_app_overview.htm&type=5). To do so, follow the steps below:

1. From Salesforce browser UI, navigate to **Setup > App Manager**.
2. Click **New Connected App** at the top right corner.
3. Create a new Connected App by going through the following steps:

    a. In the **Basic Information** section, fill in the following fields:
      - **Connected App Name**
      - **API Name**
      - **Contact Email**
      - **Logo Image URL** (optional)
      - **Info URL** (optional, use https://www.blitzz.io/)

    b. In **API (Enable OAuth Settings)** section, do the following:
      - Select the **Enable OAuth Settings** checkbox.
      - Select the **Enable for Device Flow** checkbox.
      - From the **Selected OAuth Scopes** list, add **Access and manage your data (api)**.
      - Select the **Require Secret for Web Server Flow** checkbox.

    c. Click **Save**.

4. When the app becomes available in the **App Manager** window:

    a. From the drop-down menu of the app, select **View**.

    b. In the new window, you'll find your **Consumer Key** and **Consumer Secret** values. These values correspond to the the values of the `client-id` and `client-secret` parameters of the Salesforce connection configuration respectively. To know more about the Salesforce connection configuration, go to the next section [Setting up Connection Configuration](#ii-setup-connection-configuration).

## II. Set up Connection Configuration

1. From `$REPLICANT_HOME`, navigate to the sample connection configuration file:
    ```BASH
    vi conf/conn/salesforce.yaml
    ```

2. You can store your connection credentials in a secrets management service and tell Replicant to retrieve the credentials. For more information, see [Secrets management]({{< ref "docs/security/secrets-management" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:

    ```YAML
    type: SALESFORCE

    username: 'username'
    password: 'password'
    security-token: 'security token'
    api-version: 'api version'

    client-id: 'client id'
    client-secret: 'client secret'

    # Use to specify total wait time when querying data from server. Below listed numbers are the default
    #max-retries: 20
    #retry-wait-duration-ms: 10_000

    # Use to specify number of retries and time to wait between retries in case of connection timeouts before throwing exception. Below listed numbers are the default
    #max-conn-retries: 20
    #conn-retry-wait-duration-ms: 10_000
    ```

## III. Set up Extractor Configuration

1. From `$REPLICANT_HOME`, navigate to the applier configuration file:
    ```BASH
    vi conf/src/salesforce.yaml
    ```
2. Make the necessary changes as follows:

    ```YAML
    snapshot:
      threads: 16
      #  fetch-size-rows: 250_000

    # Add specific config if needed for any of the tables that are to be replicated. Example sets Account table to be replicated with 10 jobs using LastModifiedDate column to split the data between jobs.
      per-table-config:
      - tables:
          Account:
              split-key: "LastModifiedDate"
              num-jobs: 10

    realtime:
    #  threads: 1
    ```

For a detailed explanation of configuration parameters in the extractor file, read [Extractor Reference]({{< ref "../configuration-files/extractor-reference" >}} "Extractor Reference").