---
pageTitle: Get started with Arcion on-premises UI
title: Arcion On-premises UI
description: "Quickly get started with Arcion on-premises UI with our hands-on and step-by-step guide."
weight: 2
---

# Arcion on-premises UI quickstart
This guide describes the general flow at a high level to create data replication jobs using Arcion on-premises UI.

{{< hint "info" >}}
**Tip:**: The default username and password for the console is `admin` and `acrion` respectively.
{{< /hint >}}

## Objectives
- Create a new replication job
- Pick a write mode
- Set up a data source
- Set up a target database
- Learn how to map source data
- Get an overview of your replication job

## Prerequisites
To complete this quickstart, you must first [install and set up Arcion on-premises UI]({{< ref "docs/arcion-on-premises-ui/installation-and-setup" >}}) on your system.

## Start the on-premises UI Docker
After you [first start the Docker container]({{< ref "docs/arcion-on-premises-ui/installation-and-setup#start-the-containers" >}}), the dashboard appears and shows you a list of replications you might've previously created. Otherwise, the dashboard appears empty.

Click **New Replication** to start a new replication job.

## Pick replication and write mode
In the **Set up a Replication** window, fill up the following replication details to proceed:

1. Set a **Name** and an optional **Description** for the replication.
2. Select the **Replication mode** and **Write mode** for your replication job.
3. Click **Next**.

### Replication modes
<dl class="dl-indent">
<dt>Snapshot</dt>
<dd>Use this mode for a one-time replication of data from source to target.</dd> 
<dt>Realtime</dt>
<dd>This mode can be used after a snapshot has been taken to start C<dd>
<dt>Full</dt>
<dd>This mode combines the snapshot and real time modes and automatically switches over to real time once the snapshot completes.
</dd>
</dl>

### Write modes
<dl class="dl-indent">
<dt>Replacing</dt>
<dd>
This mode takes all metadata and data from the source and replicates them to the target. This means the target drops all existing data and recreates them with the data from the source. 
</dd> 
<dt>Truncating</dt>
<dd>
This mode keeps the target tables intact and only truncates them before replicating the data from the source.
<dd>
<dt>Appending</dt>
<dd>
This mode only replicates changes to the target database but doesn't change any existing data on the target.
</dd>
</dl>

{{< hint "info" >}}
**Tip:**: If you want to keep the source in sync with the target in real time, pick **Full** replication mode and **Replacing** write mode.
{{< /hint >}}

## Set up data source
After completing the preceding steps, the **Source** window appears. This window shows you the available source connectors. You must set up these sources for every database that you would like to replicate to and from. 

Click **Add your own source** to add a data source.

### Pick the data source platform
In the **Create connection** window, pick the data source you want and click **Continue**. This quickstart uses Oracle as the source database. 

### Enter the source connection details
1. In this window, select the **Connection form** tab and fill in the connection details for your data source. All sources and targets you set up in Arcion follows a similar way. 

    The right hand side of the window displays the source documentation for easy reference.

2. Once you enter all the information, click **Save**.

### Test the connection
1. You can test the connection to your source database by clicking by clicking on **Test Connection**. This brings up a popup window with results of the connection tests. For correct connection credentials, the connection check passes every test. 
    If you face any error, check the documentation on the right side to make sure you have followed all steps correctly. Then test the connection again before proceeding. 

2. After testing your connection, click **Done** to close the popup window and then click **Continue** at the bottom of the window to proceed to the next step.


### Sync the data source
1. Click the **Sync connector** tab and click **Sync Connector** at the bottom of the window. This fetches all the metadata Arcion requires in order to filter tables and replicate data to the target database.

2. After a successful sync, the window shows the schemas and tables available to the user. Click **Continue** to move to the next step.

{{< hint "warning" >}}
**Note:** Syncing the connector can time out if the Replicant user has access to hundreds of schemas and tens of thousands of tables and slow connection. If you face timeouts, try to limit the number schemas and tables to the ones you only need to replicate. If you still face issues, please reach out to our support team.
{{< /hint >}}

3. The **Source** connector page appears listing the data source you just created. Select this new connector and click **Continue to Destination**.