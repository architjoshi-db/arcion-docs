---
pageTitle: Configuration Files
title: Configuration Files
description: "In this section, the configuration files for Arcion source connectors are covered"
weight: 1
bookCollapseSection: true
---

When configuring a Source Connector in Arcion, there are a few components/files that need to be configured. These files include:

- __Source Connector Configuration__
    - This file is where you put in the details to connect to the source database instance. The specific files for this are under the __Sources/Source Connector Setup__ section in the docs.
- __Extractor Reference Configuration__
    - This file contains all the parameters that Arcion uses while extracting data from the source database. While it is not necessary to modify most of the  parameters, you can adjust them to optimize the extraction as you need.
- __Filter Reference Configuration__
    - This file contains a set of filter rules for Arcion to follow while carrying out replication. You can filter tables, views, and queries. 
- __Source Column Transformation Configuration__
    -  This file is where you can specify the transformation logic for each individual table. As Arcion processes data from source tables, it applies the transformation rules to the data, and then loads the transformed data into the destination tables. The column on the destination could either be a new column, or a source column with transformed values
- __Source Query Configuration__
    - In this file you can set up Arcion to perform replication based on the results of source queries from source database systems to the target database systems. Source queries can be custom queries, macros, user-defined functions (UDFs), and stored procedures.

In Arcion Cloud and in the Arcion UI, each of these files can be configured directly through the UI screens.
