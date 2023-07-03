---
pageTitle: Configuration Files
title: Configuration Files
description: "In this section, we cover the configuration files for Arcion target connectors."
weight: 1
bookCollapseSection: true
---

# Configuration files
To configure a target connector in Arcion, you need to configure the following components and files:

<dl class="dl-indent">
<dt>Target connector configuration</dt>
<dd>

This file contains the details for connecting to the target database instance. For documentation on different targets, expand the **Target Connector Setup** section under **Targets** in the left navigation menu.
</dd>
<dt>Applier reference configuration</dt>
<dd>

This file allows you to configure the parameters Arcion uses while loading and applying data to the target database. You don't have to change most of the parameters, but you can adjust them to optimize the process. For more information, see [Applier configuration]({{< relref "applier-reference" >}}).
</dd>
<dt>Mapper reference configuration</dt>
<dd>

This file allows you to specify a map of rules where each rule applies to a single target catalog or schema (namespace). You can also define additional rules for specific tables and columns within the target database. For more information, see [Mapper configuration]({{< relref "mapper-reference" >}}).
</dd>
</dl>

In Arcion Cloud and in the Arcion UI, you can configure each of the preceding files through UI screens.

