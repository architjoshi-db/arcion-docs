---
pageTitle: Replicate data into MinIO and S3-compatible services
title: MinIO
description: "Learn how Arcion supports replicating data into MinIO, the S3-compliant object storage."
url: docs/target-setup/s3/minio
bookHidden: false
url: docs/target-setup/s3/minio
---

# Destination MinIO
From version 23.04.30.4, Arcion supports MinIO as a S3-compatible data target. Follow the instructions in this page to set up MinIO as the replication target in Arcion Replicant.

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## S3 file format
When Replicant loads data into S3, Replicant first converts the data to either a CSV or a JSON file. To better understand the data format for the CSV and JSON converted files, see [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}). We highly recommended that you read the [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}) page when using S3 as the target system.

## I. Set up connection configuration
Specify your MinIO connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `minio.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

```YAML
type: S3

endpoint:
  service-endpoint: SERVICE_ENDPOINT #service endpoint either with or without the protocol (e.g. https://sns.us-west-1.amazonaws.com or sns.us-west-1.amazonaws.com)
  signingRegion: "SIGNING_REGION" #region to use for SigV4 signing of requests (e.g. us-west-1)

access-key: "YOUR_MINIO_ACCESS_KEY"
secret-key: "YOUR_MINIO_SECRET_KEY"

bucket: "MINIO_BUCKET_NAME"
root: "ROOT_PATH_UNDER_BUCKET"

stage:
  type: SHARED_FS
  root-dir: PATH_TO_STAGE_DIRECTORY #directory where CSV files will be staged before uploading to S3

max-connections: 50
```

Replace the following:
- *`SERVICE_ENDPOINT`*: The service endpoint with or without the protocol—for example, `https://sns.us-west-1.amazonaws.com` or `sns.us-west-1.amazonaws.com`.
- *`SIGNING_REGION`*: The region to use for [AWS Signature Version 4](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html) requests—for example, `us-west-1`.
- *`YOUR_MINIO_ACCESS_KEY`*:  The [MinIO access key](https://min.io/docs/minio/linux/administration/identity-access-management/minio-user-management.html#access-keys) for [the MinIO user](https://min.io/docs/minio/linux/administration/identity-access-management/minio-user-management.html#id5). 
- *`YOUR_MINIO_SECRET_KEY`*: The [MinIO secret key for the MinIO user](https://min.io/docs/minio/linux/administration/identity-access-management/minio-user-management.html#id5).
- *`MINIO_BUCKET_NAME`*: [The MinIO bucket name](https://min.io/docs/minio/container/administration/console/managing-objects.html#buckets).
- *`ROOT_PATH_UNDER_BUCKET`*: The root path under MinIO bucket. Replicant creates all data files under `MINIO_BUCKET_NAME/ROOT_PATH_UNDER_BUCKET`. For example, if you set `bucket` to `arcion` and `root` to `replicant/s3dst`, Replicant creates the data files under `arcion/replicant/s3dst`.
- *`PATH_TO_STAGE_DIRECTORY`*: Directory where Replicant stages CSV files before uploading them to S3.

## II. Set up Applier configuration
Follow the instructions in [Applier configuration for Amazon S3]({{< relref "amazon-s3#ii-set-up-applier-configuration" >}}).