---
pageTitle: Arcion Cloud Quickstart
title: Arcion Cloud
description: "This hands-on quickstart guide helps you get up and running with Arcion Cloud."
weight: 1
---

# Arcion Cloud quickstart
This quickstart helps you get familiar with the Arcion Cloud UI by going through the general steps of a sample replication process. By the end of this tutorial, you can confidently start using Arcion Cloud UI.

{{< hint "info" >}}
**Tip:**: The default username and password for the Arcion Cloud console is `admin` and `arcion` respectively.
{{< /hint >}}

## Objectives
- Create a new replication job.
- Select a write mode.
- Set up a data source.
- Set up a target database.
- Filter source data.
- Specify data mappings.
- Start a replication.
- Get an overview of your replication job.

## Before you begin
Whitelist our NAT IP `52.52.196.143` in your firewall, so that Arcion can connect to your source or destination database.

## Log in
Log into [your Arcion Cloud account](http://cloud.arcion.io/). If you haven’t signed up yet, sign up using your Google account or email and password.

After logging in, the console dashboard appears and shows you a list of replications you might've previously created. Otherwise, the dashboard appears empty.

Click **New Replication** to start a new replication job.

## Select replication and write mode
In the **Set up a Replication** page, fill up the following replication details to proceed:

1. Set a **Name** and an optional **Description** for the replication.
2. Select the **Replication mode** and **Write mode** for your replication job.
3. Click **Next**.

### Replication modes
<dl class="dl-indent">
<dt>Snapshot</dt>
<dd>Use this mode for a one-time replication of data from source to target.</dd> 
<dt>Realtime</dt>
<dd>
Use this mode to replicate real-time changes from source to target. This mode also allows real-time replication after performing a snapshot.
<dd>
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
After completing the preceding steps, the **Source** page appears. This page shows you the available source connectors. You must set up these sources for every database that you would like to replicate to and from. 

Click **Add your own source** to add a data source.

### Select the data source
In the **Create connection** page, pick the data source you want and click **Continue**. This quickstart uses Oracle as the source database. 

### Enter the source connection details
1. In this page, select the **Connection form** tab and fill in the connection details for your data source. All sources and targets you set up in Arcion follows a similar way. 

    The right hand side of the page displays the source documentation for easy reference.

2. Once you enter all the information, click **Save**.

### Test the connection
1. You can test the connection to your source database by clicking by clicking on **Test connection**. This brings up a dialog with results of the connection tests. For correct connection credentials, the connection check passes every test. 
    If you face any error, check the documentation on the right side to make sure you have followed all steps correctly. Then test the connection again before proceeding. 

2. After testing your connection, click **Done** to close the dialog and then click **Continue** at the bottom of the page to proceed to the next step.

### Sync the data source
1. Click the **Sync connector** tab and click **Sync connector** at the bottommost pane. This fetches all the metadata Arcion requires in order to filter tables and replicate data to the target database.

2. After a successful sync, the page shows the schemas and tables available to the user. Click **Continue** to move to the next step.

    {{< hint "warning" >}}
**Caution:** Syncing the connector can time out if the Replicant user has access to hundreds of schemas and tens of thousands of tables and slow connection. If you face timeouts, try to limit the number schemas and tables to the ones you only need to replicate. If you still face issues, please reach out to [our support team](mailto:support@arcion.io).
    {{< /hint >}}

3. The **Source** connector page appears listing the data source you just created. Select this new connector and click **Continue to destination**.

## Set up target database
Click **Add your own destination** to start the process.

### Select the target database
In the **Create connection** page, pick the target database you want and click **Continue**. This quickstart uses Databricks as the target.

### Enter the target connection details
1. In this page, select the **Connection form** tab and fill in the connection details for your target. Similar to the source, the right hand side of the page displays the target documentation for easy reference.
2. Once you enter all the information, click **Save** and then **Continue**. You don't need to sync this connector since it's not a source.
3. The **Destination** connector page appears listing the target you just created. Select this new connector and click **Continue to filter**.

## Filter data for replication
The **Filter** page lists the databases and catalogs that you can select to replicate to the target database. You can pick specific tables and columns from each database and table that you want.

If the database, catalog, or table you're looking for doesn't appear in the list, try these steps: 
1. Check the database permissions for the user you've used for authentication in the data source.
2. Click **Sync schemas** on the right hand side of the page to refresh the metadata.

For more information about filters, see [Filter configuration]({{< ref "docs/sources/configuration-files/filter-reference" >}}).

## Specify data mappings
If you want to rename or map tables to different databases or catalogs, click **Map tables** at the bottom of the **Filter** page. 

The **Mapper** page displays the catalogs or databases and the tables for each one that you pick in [the **Filter** page](#filter-data-for-replication). The left side shows **Source names** and the right side shows **Target names**. You can change any one of these all the way down to the column level and that’s how they appear on the target.

For more information about mapping rules, see [Mapper configuration]({{< ref "docs/targets/configuration-files/mapper-reference" >}}).

## Start the replication job
1. Review your replication details. The left pane of the page displays all the previous steps you've completed:

    a. **General**

    b. **Source**
    
    c.  **Filter**
  
    To get back to a previous step, click any of the previous steps. If everything looks OK, click **Save**.
2. Click **Start replication** to start the replication job.

## Replication job overview
After starting the replication, the next page displays **Initializing** in the top right hand corner. This message changes to **Running** with a green bacground once the initialization process finishes. In the middle of the screen, various replication statistics gradually appears.

### Replication Details
To view replication details, click **View details**. It shows each catalog and table undergoing replication and the number of each operation performed on each. To go back to the summary page, click **Back to summary** in the top left hand corner of the **View details** page.

### Actions
After a replication starts, you can take several actions based on your requirements. To see the list of actions, expand the **Actions** section on the top right of the summary page. For example, if you want to stop the replication, choose **Stop** from the **Actions** menu.

At the bottom of the replication summary page, the **User actions** pane on the left shows different actions that users have carried out over time on the replication job:

- **Stopped**
- **Started**
- **Restarted**
- **Resumed**

### Logging
On the right side of the **User actions** pane, the following three tabs contain logging and troubleshooting information about the replication job:

<dl class="dl-indent">
<dt>Trace log</dt>
<dd>
Shows the output of the replication job.
</dd> 
<dt>Errors</dt>
<dd>
Only shows the errors if any exists. 
<dd>
<dt>Events</dt>
<dd>
This tab is currently undergoing implementation.
</dd>
</dl>

![The logging pane containing the three preceding tabs in the Arcion Cloud console UI](/images/logging_pane.png)

To search through the contents of a tab, use the **Search** field under the respective tab. To search backward and forward inside a tab, use the **Prev find** and **Next find** buttons.

### Additional features
Next to the **Prev find** and **Next find** buttons, the following buttons allows you to perform some additional actions:

<dl class="dl-indent">
<dt><span class="material-symbols-outlined">fullscreen</span></dt>
<dd>
Maximize the current tab’s output.
</dd> 
<dt><span class="material-symbols-outlined">cloud_download</span></dt>
<dd>
Download all the logfiles and configuration files to troubleshoot issues.
<dd>
</dl>
