---
pageTitle: Configuration Files
title: Configuration Files
description: "In this section, the configuration files for Arcion target connectors are covered"
weight: 1
bookCollapseSection: true
---

When configuring a Target Connector in Arcion, there are a few components/files that need to be configured. These files include:

- __Target Connector Configuration__
    - This file is where you put in the details to connect to the target database instance. The specific files for this are under the __Targets/Target Connector Setup__ section in the docs.
- __Applier Reference Configuration__
    - This file contains all the parameters that Arcion uses while loading and applying data to the tables in the target database.
- __Mapper Reference Configuration__
    - This file contains a map of rules where each rule applies to a single Target catalog or schema (namespace). You can also define additional rules for specific tables and columns within the target database.

In Arcion Cloud and in the Arcion UI, each of these files can be configured directly through the UI screens.