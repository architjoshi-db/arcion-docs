---
pageTitle: Transforming Source data  
title: Source Column Transformation
description: "Know how to transform Source data using transformation rules in a configuration file."
bookHidden: false
weight: 12
url: docs/references/source-column-transformation
---

# Source column transformation
From version 22.07.19.3 onwards, Replicant allows you to transform the data of source tables before it reaches the target. 

## Overview
To achieve source column transformation, Replicant uses a configuration file that contains transformation logic for each individual table. As Replicant processes data from source tables, Replicant applies the transformation rules to the data, and then loads the transformed data into the destination tables. The column on the destination could either be a new column, or a source column with transformed values.

Source column transformation solves several business cases for data migration, while making it possible to build new features like data encryption and obfuscation.

### Supported platforms

Source column transformation is supported for the following pipelines:

- [MySQL]({{< relref "../source-setup/mysql" >}}) to [Databricks]({{< ref "docs/targets/target-setup/databricks" >}})
- [Informix]({{< relref "../source-setup/informix" >}}) to [PostgreSQL]({{< ref "docs/targets/target-setup/postgresql" >}})
- [Informix]({{< relref "../source-setup/informix" >}}) to [Kafka]({{< ref "docs/targets/target-setup/kafka" >}})

## Transformation configuration file
The transformation conifiguration file contains all the transformation logic for each table. You can access some sample configuration files inside the `conf/transformation/` directory of your [Replicant self-hosted CLI download folder]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}). 

### About YAML syntax for transformation configuration file
Transformation configuration file uses YAML syntax. If you're new to YAML and want to learn more, see [Learn YAML in Y minutes](https://learnxinyminutes.com/docs/yaml/).

You can access some sample transformation configuration inside the `conf/transformation/` directory of your [Replicant self-hosted CLI download folder]({{< ref "docs/quickstart/arcion-self-hosted#ii-download-replicant-and-create-replicant_home" >}}).

### `type`
The type of transformation. For source column transformation, set it to `COLUMN`.

### `enable`
`{true|false}`. 

Set this to `true` to enable transformation.

### `per-table-config`
Use `per-table-config` to specify the the following:

- The [catalog](#per-table-configcatalog) and [schema](#per-table-configschema)
- The [tables](#per-table-configtables) under the catalog and schema
- The [operations](#per-table-configtablestable_nameoperations)

For example, the following configuration specifies catalog `tpch` and schema `public`, and two tables `nation` and `lineitem`.

```YAML
type: COLUMN
enable: true
per-table-config:
  - catalog: tpch                                    
    schema: public                                   
    tables:
      nation:
        ...            
      lineitem:
        ... 
```

### `per-table-config.catalog`
Specify the database catalog. Don't specify this parameter if the source database doesn't support it.

```YAML
type: COLUMN
enable: true
per-table-config:
  - catalog: tpch                                   
```

### `per-table-config.schema`
Specify the database schema. Don't specify this parameter if the source database doesn't support it.

```YAML
type: COLUMN
enable: true
per-table-config:
  - catalog: tpch
    schema: public                                                                  
```

### `per-table-config.tables`
Use `per-table-config.tables` to define the specific tables to apply transformation to and the transformation logic. You can define transformation logic for single or multiple tables, and have different transformation logic for each table. For example, the following defines transformation logic for two tables `nation` and `lineitem` that both belong to catalog `tpch` and schema `public`.

```YAML {hl_lines=["6-24"]}
type: COLUMN
enable: true
per-table-config:
  - catalog: tpch                                    
    schema: public                                   
    tables:
      nation:
        operations:
          - modulo:                                  
              enable: true                           
              source-column: A                       
              mod-by-column: D                       
              mod-by-value: 5                        
              computed-column: F                       
              computed-column-datatype: "INTEGER"      
              computed-column-key-type: SHARDKEY
      lineitem:
        operations:
          - modulo:
              enable: true
              source-column: l_orderkey
              mod-by-column: l_partkey
              computed-column: l_orderkey1
              computed-column-datatype: "DECIMAL(15, 2)"
```

### `per-table-config.tables.<TABLE_NAME>.operations`

Use `per-table-config.tables.<TABLE_NAME>.operations` to define the operations to perform on source column for the transformation. 
Arcion supports the following operation types:

- `concat`
- `modulo`
- `trim`

`concat`
: Compute a column by concatenating source column and [`concat.concat-by-columns`](#concatconcat-by-columns).

  #### `concat.enable`
  `{true|false}`.
  
  Enable or disable concatenation.

  #### `concat.source-column`
  The source column name.
  
  #### `concat.concat-by-columns`
  An array of string values and column names that you want to concatenate with [`concat.source-column`](#concatsource-column). Replicant performs concatenation in the same order as you specify in this list. For example, the following example concatenates the string `"_"` and the column `Q` to source column `p`.

  ```YAML {hl_lines=[12]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - concat:
                enable: true
                source-column: p
                concat-by-columns: ["_", "column:Q"]   
  ``` 
  
  #### `concat.computed-column`
  The computed column that results from the concatenation. For example, in the following sample, the computed column `S` results from the concatenation `P + "_" + Q`.
  

  ```YAML {hl_lines=[13]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - concat:                                  
                enable: true                            
                source-column: P                        
                concat-by-columns: ["_", "column:Q"]   
                computed-column: S                       
  ```

  #### `concat.computed-column-datatype`
  Specifies data type for the computed column. If `null`, Replicant uses the data type of `source-column`.
  
  ```YAML {hl_lines=[14]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - concat:                                  
                enable: true                            
                source-column: P                        
                concat-by-columns: ["_", "column:Q"]   
                computed-column: S
                computed-column-datatype: ""                      
  ```

`modulo`
: Compute a column by performing modulo operation on source column by either [`modulo.mod-by-value`](#modulomod-by-columnmod-by-value) or [`modulo.mod-by-column`](#modulomod-by-columnmod-by-value).

  #### `modulo.enable`
  `{true|false}`.
  
  Enable or disable modulo operation.

  #### `modulo.source-column`
  The source column name.
  
  #### `modulo.{mod-by-column|mod-by-value}`
  Use `modulo.mod-by-column` to specify the numeric value column to use to calculate the modulo of source column. 
  Use `modulo.mod-by-value` to specify the numeric value to use to calculate the modulo of source column. 
  
  Use either `modulo.mod-by-column` or `modulo.mod-by-value` but not both. In both bases, make sure that the data type is the same as [`modulo.source-column`](#modulosource-column).

  {{< columns >}}
  ##### Example: Use `modulo.mod-by-column`
  In the following example, the modulo operation for the computed column `F` reads as `F = A % D`.
  
  ```YAML {hl_lines=[12]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - modulo:                                  
                enable: true                           
                source-column: A                       
                mod-by-column: D                       
                computed-column: F                       
  ```
  <--->

  ##### Example: Use `modulo.mod-by-value`
  In the following example, the modulo operation for the computed column `F` reads as `F = A % 5`.

  ```YAML {hl_lines=[12]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - modulo:                                  
                enable: true                           
                source-column: A                       
                mod-by-value: 5                       
                computed-column: F                       
  ```
  {{< /columns >}}

  #### `modulo.computed-column`
  The computed column that results from the modulo operation. This can be a new column that Replicant creates on the target, or the same as the source column, or any other column in the same table. 
  
  For example, in the following sample, the computed column `F` results from the modulo operation `A % 5`.
  
  ```YAML {hl_lines=[13]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - modulo:                                  
                enable: true                           
                source-column: A                       
                mod-by-value: 5                       
                computed-column: F                     
  ```

  #### `modulo.computed-column-datatype`
  Specify the data type for the computed column. If `null`, Replicant uses the data type of `source-column`. If you specify `modulo.computed-column-datatype`, then Replicant tries to convert the operation result into that data type. The conversion might fail due to compatibility.
  
  ```YAML {hl_lines=[14]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - modulo:                                  
                enable: true                           
                source-column: A                       
                mod-by-value: 5                       
                computed-column: F                   
                computed-column-datatype: "INTEGER"                     
  ```

  #### `modulo.computed-column-keytype`
  This parameter supports only `SHARDKEY` as value. Specify this parameter to use [`modulo.computed-column`](#modulocomputed-column) as shard key for the destination table. 
  
  In the following example, Replicant uses the computed column `F` as the shard key column on destination database.
  
  ```YAML {hl_lines=[15]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - modulo:                                  
                enable: true                           
                source-column: A                       
                mod-by-value: 5                       
                computed-column: F                   
                computed-column-datatype: "INTEGER"
                computed-column-key-type: SHARDKEY                  
  ```

`trim`
: Trim whitespaces from start and end of a source column value.

  #### `trim.enable`
  `{true|false}`.
  
  Enable or disable trim operation.

  #### `trim.source-column`
  The source column name.

  #### `trim.computed-column`
  The computed column that results from the trim operation. For example, in the following sample, if `X = "name    "`, then `Y = "name"`.
  
  ```YAML {hl_lines=[12]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - trim:                                    
                enable: true                            
                source-column: X                        
                computed-column: Y                  
  ```

  #### `trim.computed-column-datatype`
  Specify the data type for the computed column. If `null`, Replicant uses the data type of `source-column`.
  
  ```YAML {hl_lines=[13]}
  type: COLUMN
  enable: true
  per-table-config:
    - catalog: tpch                                    
      schema: public                                   
      tables:
        nation:
          operations:
            - trim:                                    
                enable: true                            
                source-column: X                        
                computed-column: Y
                computed-column-datatype: ""                
  ```

{{< hint "info" >}}
**Note:**
- Computed column can be the same as source column, new column, or any other column in same table.
- If you don't specify `computed-column-datatype` and `computed-column` does not exist in source table, then Replicant uses the data type of `source-column`.
- If `computed-column` exists in source table, then Replicant uses the datatype of `source-column`.
- If you specify `computed-column-datatype`, then Replicant tries its best to covert operation result into that data type. The conversion might fail due to compatibility issue.

We recommend that you do not use `computed-column-datatype`. In that case, Replicant can fall back to using the data type of `source-column`.
{{< /hint >}}

## Limitations

- Column can be a part of `source-column`, `computed-column` in only one operation. For example, if column `F` is part of modulo operation as a `source-column` or `computed-column`, then you can't use column `F` in any other operation.
- Certain operations support specific data types only. For example, the `modulo` operation only works with numeric types.
- Only supported for [`snapshot`]({{< ref "docs/running-replicant#replicant-snapshot-mode" >}}), [`realtime`]({{< ref "docs/running-replicant#replicant-realtime-mode" >}}) and [`full`]({{< ref "docs/running-replicant#replicant-full-mode" >}}) mode.

## Running Replicant

To use source column transformation, run Replicant with the `--transform` argument and provide it the location to the transformation configuration file. For example:

```shell {hl_lines=[7]}
./bin/replicant snapshot \
 conf/conn/source_database_name_src.yaml \
 conf/conn/target_database_name_dst.yaml \
 --extractor conf/src/source_database_name.yaml \
 --applier conf/dst/target_database_name.yaml  \
 --filter filter/source_database_name_filter.yaml \
 --transform conf/transformation/column_transform.yaml \
 --id repl2 --replace --overwrite
```