---
pageTitle: Configuration Files
title: Configuration Files
description: "In this section, the configuration files for Arcion source connectors are covered"
weight: 1
bookCollapseSection: true
---

# Configuration files
To configure a source connector in Arcion, you need to configure the following components and files:

<dl class="dl-indent">
<dt>Source connector configuration</dt>
<dd>

This file contains the details for connecting to the source database instance. For documentation on different sources, expand the **Source Connector Setup** section under **Sources** in the left navigation menu.
</dd>
<dt>Extractor reference configuration</dt>
<dd>

This file allows you to configure all the parameters Arcion uses while extracting data from the source database. You don't have to change most of the parameters, but you can adjust them to optimize the extraction. For more information, see [Extractor configuration]({{< relref "extractor-reference" >}}).
</dd>
<dt>Filter reference configuration</dt>
<dd>

This file allows you to specify a set of filter rules for Arcion to follow while carrying out replication. You can filter tables, views, and queries. For more information, see [Filter configuration]({{< relref "filter-reference" >}})
</dd>
<dt>Source column transformation configuration</dt>
<dd>

This file allows you to specify the transformation logic for each individual table. As Arcion processes data from source tables, it applies the transformation rules to the data, and then loads the transformed data into the destination tables. The column on the destination can either be a new column, or a source column with transformed values. For more information, see [Source column transformation]({{< relref "source-column-transformation" >}}).
</dd>
<dt>Source query configuration</dt>
<dd>

This file allows you to set up Arcion to perform replication based on the results of source queries from source database systems to the target database systems. Source queries can be custom queries, macros, user-defined functions (UDFs), and stored procedures. For more information, see [Replication of source queries]({{< relref "src-queries" >}}).
</dd>

In Arcion Cloud and in the Arcion UI, you can configure each of the preceding files through UI screens.
