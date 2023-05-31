---
pageTitle: Arcion internal CDC format 
title: Arcion Internal CDC Format for S3
description: "When loading data into Amazon S3, learn how Arcion uses its own internal CDC format and converts Source data into either CSV or JSON for realtime replication."
weight: 1
---

# Arcion Internal CDC Format for Amazon S3

When loading data into S3, Replicant first converts the data extracted from the source database into either of the following two formats: 
- CSV
- JSON

Both types of files are structured conforming to the replicated data. In the following sections, we discuss both CSV and JSON file formats for snapshot and realtime replication modes with examples.


## CSV file format

### Snapshot mode

In snapshot mode, if the original table contains _X_ columns,  Replicant assigns a row in the CSV file for holding the data of those _X_ columns. For example, if the original table has three columns containing the values `0`, `Africa`, and `Africa` respectively, the the data in the CSV file has the following structure:

```csv
0, AFRICA ,AFRICA
```

### Full and realtime mode

In full and realtime mode, if the original table contains _X_ columns, a row in the CSV file contains data for _3X+3_ columns. Every row corresponds to a single DML operation.

You can interpret the first _3X_ columns of a row as _X_ triplets, where each triplet represents the following:

* **NEW_VAL**. The new value for that column coming through the DML operation.
* **OLD_VAL**. The old value of that column which the DML operation is going to change to **NEW_VAL**.
* **EXISTS_VAL**. An integer. It can have the following values:
  - 0: The column value is not present in neither NEW_VAL nor OLD_VAL section of the DML.
  - 1: The column value is present in NEW_VAL section of the DML.
  - 2: The column value is present in OLD_VAL section of the DML. 
  - 3: The column value is present in both NEW_VAL nor OLD_VAL section of the DML.

{{< hint "info" >}}
**Note**:
* EXISTS_VAL is required to differentiate when a column value is null. If the corresponding EXISTS_VAL is non-zero, that means the user has provided null value in the DML. If it’s zero, that means that the user hasn’t mentioned the column in the DML.
* The last three columns of a row contain metadata required for consistent replication recovery. The names of the columns are printed at the top of every file if [the `include-header` parameter is `true` in the Applier configuration]({{< ref "docs/targets/target-setup/s3/amazon-s3#ii-set-up-applier-configuration" >}}).
{{< /hint >}}

In the following sections, we go through some examples for insert, update, and delete operations.

#### Sample insert operation
Consider the following DML for an insert operation:

```DML  
INSERT INTO tpch.region (r_regionkey,r_comment,r_name) VALUES(10,'India','India');
```

The CSV file structure for the preceding operation is as follows:

```CSV
India,NULL,1,India,NULL,1,10,NULL,1,I,"{""extractorId"":0,""nodeID"":""node1"",""/
timestamp"":1620787841959,""extractionTimestamp"":1620787841959,""dscId"":/
1620787053904,""mutId"":1048408,""partNum"":1,""v"":2}","{""insertCount"":6,""updateCount"":0,"/
"deleteCount"":0,""replaceCount"":0}"
```
`INSERT` statement doesn’t have any OLD_VAL section. Every triplet has EXISTS_VAL as `1`.


#### Sample update operation
Consider the following DML for an update operation:

```DML
UPDATE tpch.region SET r_comment = 'USA' WHERE r_regionkey = 10;
```

The CSV file structure for the preceding operation is as follows:

```CSV
USA,NULL,1,NULL,NULL,0,NULL,10,2,U,"{""extractorId"":0,""nodeID"":""node1"",/
""timestamp"":1620787852116,""extractionTimestamp"":1620787852116,""dscId""/
:1620787053904,""mutId"":1048480,""partNum"":1,""v"":2}","{""insertCount"":6,"/
"updateCount"":1,""deleteCount"":0,""replaceCount"":0}"/
```

In the preceding `UPDATE` statement, the `SET` section corresponds to NEW_VAL and the `WHERE` section corresponds to OLD_VAL. `r_name` has no presence in any section. That's why EXISTS_VAL is `0`.

#### Sample delete operation
Consider the following DML for a delete operation:

```DML
DELETE FROM tpch.region WHERE r_regionkey = 10;
```

The CSV file structure for the preceding operation is as follows:
```CSV
NULL,NULL,0,NULL,NULL,0,NULL,10,2,D,"{""extractorId"":0,""nodeID"":""node1"/
",""timestamp"":1620787872370,""extractionTimestamp"":1620787872370,""dscI"":1620787053905,"/
"mutId"":1721,""partNum"":1,""v"":2}","{""insertCount"":6,"/
"updateCount"":1,""deleteCount"":1,""replaceCount"":0}"
```

## JSON file format

For snapshot, full, and realtime mode, the JSON file has the following parameters to represent table data in Arcion internal CDC format:

### `tableName`
The catalog, schema, or table name.

### `opType`
The event type. The following three event types are available corresponding to three DML operations:

  <dl class="dl-indent">

  <dt><code>I</code></dt>
  <dd>
    An insert operation.
  </dd>

  <dt><code>U</code></dt>
  <dd>
    An update operation.
  </dd>

  <dt><code>D</code></dt>
  <dd>
    A delete operation.
  </dd>

  </dl>

### `cursor`
The metadata of extraction event. The metadata consists of timestamp of query, timestamp of query extracted from logs, cursor position, and name of the log file. The query timestamp is the timestamp when you executed a query. The extraction timestamp is the timestamp when you extracted the query from the logs. You can consider the difference between the query timestamp and the extraction timestamp as a lag.

### `before`
The image of the rows before the execution of the query.

### `after`
The image of the rows once execution of the query finished.

### `exists`
An integer. It can have the following four values:

<dl class="dl-indent" >

  <dt><code>0</code></dt>
  <dd>
    The column value is not present in neither before nor after section of the DML.
  </dd>

  <dt><code>1</code></dt>
  <dd>
    The column value is present in the after section of the DML.
  </dd>

  <dt><code>2</code></dt>
  <dd>
    The column value is present in the before section of the DML.
  </dd>
  
  <dt><code>3</code></dt>
  <dd>
    The column value is present in both after and before section of the DML.
  </dd>
</dl>

`exists` is required to differentiate between a user-provided and a system-generated null value.

### `operationcount`
Counts the total number of delete, insert, or update events Replicant has processed untill now.

### Examples for snapshot mode
In the following sections, we go through some examples for insert, update, and delete operations in snapshot mode.

#### Sample insert operation
Consider the following DML for an insert operation:

```DML
INSERT INTO tpch_scale_0_01.nation values(100,"Testing name",2,"Testing comment");
```

The JSON file structure for the preceding operation is as follows:

```JSON
{
  "tableName":{
    "namespace":{
      "catalog":"tpch_scale_0_01",
      "schema":"default_schema",
      "hash":-27122659
    },
    "name":"nation",
    "hash":-1893420405
  },
  "opType":"I",
  "cursor":"{\"extractorId\":0,\"timestamp\":1657516903000,\"extractionTimestamp\":1657516904088,\"log\":\"log-bin.000010\",\"position\":7461,\"logSeqNum\":1,\"slaveServerId\":1,\"v\":2}",
  "before":{
    "n_comment":"null",
    "n_nationkey":"null",
    "n_regionkey":"null",
    "n_name":"null"
  },
  "after":{
    "n_comment":"Testing comment",
    "n_nationkey":"100",
    "n_regionkey":"2",
    "n_name":"Testing name"
  },
  "exists":{
    "n_comment":"1",
    "n_nationkey":"1",
    "n_regionkey":"1",
    "n_name":"1"
  },
  "operationcount":"{\"insertCount\":30,\"updateCount\":0,\"deleteCount\":0,\"replaceCount\":0}"
}
```

#### Sample update operation
Consider the following DML for an update operation:

```DML
UPDATE tpch_scale_0_01.nation set n_name="Updating test name" where n_nationkey=100;
```

The JSON file structure for the preceding operation is as follows:

```JSON
{
  "tableName":{
    "namespace":{
      "catalog":"tpch_scale_0_01",
      "schema":"default_schema",
      "hash":-27122659
    },
    "name":"nation",
    "hash":-1893420405
  },
  "opType":"U",
  "cursor":"{\"extractorId\":0,\"timestamp\":1657516946000,\"extractionTimestamp\":1657516947142,\"log\":\"log-bin.000010\",\"position\":9149,\"logSeqNum\":1,\"slaveServerId\":1,\"v\":2}",
  "before":{
    "n_comment":"Testing comment",
    "n_nationkey":"100",
    "n_regionkey":"2",
    "n_name":"Testing name"
  },
  "after":{
    "n_comment":"Testing comment",
    "n_nationkey":"100",
    "n_regionkey":"2",
    "n_name":"Updating test name"
  },
  "exists":{
    "n_comment":"3",
    "n_nationkey":"3",
    "n_regionkey":"3",
    "n_name":"3"
  },
  "operationcount":"{\"insertCount\":30,\"updateCount\":1,\"deleteCount\":0,\"replaceCount\":0}"
}
```

#### Sample delete operation
Consider the following DML for a delete operation:

```DML
DELETE from tpch_scale_0_01.nation where n_nationkey=100;
```

The JSON file structure for the preceding operation is as follows:

```JSON
{
  "tableName":{
    "namespace":{
      "catalog":"tpch_scale_0_01",
      "schema":"default_schema",
      "hash":-27122659
    },
    "name":"nation",
    "hash":-1893420405
  },
  "opType":"D",
  "cursor":"{\"extractorId\":0,\"timestamp\":1657516954000,\"extractionTimestamp\":1657516955151,\"log\":\"log-bin.000010\",\"position\":9872,\"logSeqNum\":1,\"slaveServerId\":1,\"v\":2}",
  "before":{
    "n_comment":"Testing comment",
    "n_nationkey":"100",
    "n_regionkey":"2",
    "n_name":"Updating test name"
  },
  "after":{
    "n_comment":"null",
    "n_nationkey":"null",
    "n_regionkey":"null",
    "n_name":"null"
  },
  "exists":{
    "n_comment":"2",
    "n_nationkey":"2",
    "n_regionkey":"2",
    "n_name":"2"
  },
  "operationcount":"{\"insertCount\":30,\"updateCount\":1,\"deleteCount\":1,\"replaceCount\":0}"
}
```

### Examples for full and realtime mode
In the following sections, we go through some examples for insert, update, and delete operations in realtime mode.

#### Sample insert operation
Consider the following DML for an insert operation:

```DML
INSERT INTO tpch.region (r_regionkey,r_comment,r_name) VALUES(10,'India','India');
```

The JSON file structure for the preceding operation is as follows:

```JSON
{
  "tableName": {
    "namespace": {
      "catalog": null,
      "schema": "io_blitzz",
      "hash": 696406511
    },
    "name": "region",
    "hash": -821029210
  },
  "opType": "I",
  "cursor":
  "{\"extractorId\":0,\"nodeID\":\"node1\",\"timestamp\":1620788088431,\"extraction Timestamp\":1620788088431,\"dscId\":1620787053905,\"mutId\":326118,\"partNu m\":1,\"v\":2}",
    "before": {
      "r_regionkey": "null",
      "r_comment": "null",
      "r_name": "null"
      },
    "after": {
      "r_regionkey": "10",
      "r_comment": "India",
      "r_name": "India"
      },
    "exists": {
      "r_regionkey": "1",
      "r_comment": "1",
      "r_name": "1"
    },
    "operationcount": "{\"insertCount\":6,\"updateCount\":0,\"deleteCount\":0,\"replaceCount\":0}"
}
```

#### Sample update Operation
Consider the following DML for an update operation:

```DML
UPDATE tpch.region SET r_comment = 'USA' WHERE r_regionkey = 10;
```

The JSON file structure for the preceding operation is as follows:

```JSON
{
  "tableName": {
    "namespace": {
      "catalog": null,
      "schema": "io_blitzz",
      "hash": 696406511
    },
    "name": "region",
    "hash": -821029210
    },
    "opType": "U",
      "cursor":
      "{\"extractorId\":0,\"nodeID\":\"node1\",\"timestamp\":1620788090478,\"extraction Timestamp\":1620788090478,\"dscId\":1620787053905,\"mutId\":326190,\"partN um\":1,\"v\":2}",
      "before": {
        "r_regionkey": "10",
        "r_comment": "null",
        "r_name": "null"
      },
      "after": {
        "r_regionkey":
        "null", "r_comment": "USA",
        "r_name": "null"
      },
      "exists": {
        "r_regionkey": "2",
        "r_comment": "1",
        "r_name": "0"
      },
      "operationcount":
      "{\"insertCount\":6,\"updateCount\":1,\"deleteCount\":0,\"replaceCount\":0}"
}
```

#### Sample delete Operation
Consider the following DML for a delete operation:

```DML
DELETE FROM tpch.region WHERE r_regionkey = 10;
```

The JSON file structure for the preceding operation is as follows:

```JSON
{
  "tableName": {
    "namespace": {
      "catalog": null,
      "schema": "io_blitzz",
      "hash": 696406511
    },
    "name": "region",
    "hash": -821029210
  },
  "opType": "D",
  "cursor":
  "{\"extractorId\":0,\"nodeID\":\"node1\",\"timestamp\":1620788092539,\"extraction Timestamp\":1620788092539,\"dscId\":1620787053905,\"mutId\":326250,\"partN um\":1,\"v\":2}",
    "before": {
      "r_regionkey": "10",
      "r_comment": "null",
      "r_name": "null"
    },
    "after": {
      "r_regionkey": "null",
      "r_comment": "null",
      "r_name": "null"
    },
    "exists": {
      "r_regionkey": "2",
      "r_comment": "0",
      "r_name": "0"
    },
    "operationcount":
    "{\"insertCount\":6,\"updateCount\":1,\"deleteCount\":1,\"replaceCount\":0}"
}
```

## More sample DMLs and corresponding JSON format
If you need more sample DMLs and their corresponding JSON files for Arcion internal CDC format, refer to the following download links for realtime mode and snapshot mode respectively.

{{< button href="https://drive.google.com/file/d/1p-24BDWbJBrOcLShJqYsrXL7f4l3VM5a/view?usp=sharing" >}}Download samples in ZIP for realtime mode{{< /button >}}

{{< button href="https://drive.google.com/file/d/1-oGF2AmrT6bCTBLJaKUkbifNfVC-F60q/view?usp=sharing" >}}Download samples in ZIP for snapshot mode{{< /button >}}

