---
pageTitle: Set up Amazon S3 as target
title: Amazon S3
description: "Get real-time data replication into Amazon S3 with Arcion. Arcion efficiently loads data into S3 using a custom CDC format."
url: docs/target-setup/s3/amazon-s3
bookHidden: false
---

# Destination Amazon S3
The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## S3 file format
When Replicant loads data into S3, Replicant first converts the data to either a CSV or a JSON file. To better understand the data format for the CSV and JSON converted files, see [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}). We highly recommended that you read the [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}) page when using S3 as the target system.

## I. Set up connection configuration
Specify your Amazon S3 connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `s3.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

```YAML
type: S3

access-key: "ACCESS_KEY_ID"
secret-key: "SECRET_ACCESS_KEY"

bucket: "BUCKET_NAME"
root: "ROOT_PATH_UNDER_BUCKET"

stage:
  type: SHARED_FS
  root-dir: PATH_TO_STAGE_DIRECTORY

file-format: {CSV|JSON}
max-connections: 50
```

Replace the following:
- *`ACCESS_KEY_ID`*: The [access key ID of the user access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html)—for example, `AKIAIOSFODNN7EXAMPLE`.
- *`SECRET_ACCESS_KEY`*: The [secret access key of the user access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html)—for example, `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`. Make sure that the user possesses the [AmazonS3FullAccess managed policy](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-iam-awsmanpol.html#security-iam-awsmanpol-amazons3fullaccess).
- *`BUCKET_NAME`*: [The S3 bucket name](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html).
- *`ROOT_PATH_UNDER_BUCKET`*: The root path under S3 bucket. Replicant creates all data files under `BUCKET_NAME/ROOT_PATH_UNDER_BUCKET`. For example, if you set `bucket` to `arcion` and `root` to `replicant/s3dst`, Replicant creates the data files under `arcion/replicant/s3dst`.
- *`PATH_TO_STAGE_DIRECTORY`*: Directory where Replicant stages CSV files before uploading them to S3—for example, `/home/user/stage`.

## II. Set up Applier configuration
To configure replication mode according to your requirements, specify your configuration in the Applier configuration file. You can find a sample Applier configuration file `s3.yaml` in the `$REPLICANT_HOME/conf/dst` directory. For example:

```YAML
snapshot:
  threads: 16
  max-file-size: 33_554_432 #32MB
  delimiter: `,` #CSV files created will have provided delimiter
  quote: `”`
  escape:   `\`
  include-header: false #enable or disable toggle column names as header in CSV file

realtime:
  threads: 16
```