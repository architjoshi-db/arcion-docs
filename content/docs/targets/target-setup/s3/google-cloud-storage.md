---
pageTitle: Replicate data into S3-compatible Google Cloud Storage
title: Google Cloud Storage
description: "Learn how to achieve fast data replication into Google Cloud Storage using the S3 compatiblity API."
bookHidden: false
url: docs/target-setup/s3/google-cloud-storage
---

# Destination Google Cloud Storage (GCS)
From version 23.04.30.4, Arcion supports replicating data into [Google Cloud Storage using the S3 compatibility API](https://cloud.google.com/storage/docs/interoperability). Follow the instructions in this page to set up Cloud Storage as data target in Arcion Replicant.

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## S3 file format
When Replicant loads data into S3, Replicant first converts the data to either a CSV or a JSON file. To better understand the data format for the CSV and JSON converted files, see [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}). We highly recommended that you read the [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}) page when using S3 as the target system.

## I. Set up connection configuration
Specify your Cloud Storage connection details to Replicant with a connection configuration file. You can find a sample connection configuration file `gcs.yaml` in the `$REPLICANT_HOME/conf/conn` directory.

```YAML
type: S3

endpoint:
  service-endpoint: SERVICE_ENDPOINT
  signingRegion: "SIGNING_REGION"

access-key: "YOUR_HMAC_ACCESS_ID"
secret-key: "YOUR_HMAC_SECRET"

force-path-style: {true|false}

bucket: "BUCKET_NAME"
root: "ROOT_PATH_UNDER_BUCKET"

stage:
  type: SHARED_FS
  root-dir: PATH_TO_STAGE_DIRECTORY

max-connections: 50
```

Replace the following:
- *`SERVICE_ENDPOINT`*: The service endpoint with or without the protocol—for example, `https://storage.googleapis.com` or `storage.googleapis.com`.
- *`SIGNING_REGION`*: The region to use for [AWS Signature Version 4](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html) requests—for example, `us-west-1`.
- *`YOUR_HMAC_ACCESS_ID`*:  The [HMAC access ID](https://cloud.google.com/storage/docs/authentication/hmackeys) associated with the service account or the user account.
- *`YOUR_HMAC_SECRET`*: The [HMAC secret](https://cloud.google.com/storage/docs/authentication/hmackeys) linked to the HMAC access ID you specify in `YOUR_HMAC_ACCESS_ID`.
- *`BUCKET_NAME`*: [The Cloud Storage bucket name](https://cloud.google.com/storage/docs/buckets)—for example, `arcion-gcp-as-target`.
- *`ROOT_PATH_UNDER_BUCKET`*: The root path under the Cloud Storage bucket. Replicant creates all data files under `BUCKET_NAME/ROOT_PATH_UNDER_BUCKET`. For example, if you set `bucket` to `arcion-gcp-as-target` and `root` to `replicant/s3dst`, Replicant creates the data files under `arcion-gcp-as-target/replicant/s3dst`.
- *`PATH_TO_STAGE_DIRECTORY`*: Directory where Replicant stages CSV files before uploading them to Cloud Storage—for example, `/home/user/stage`.

Set `force-path-style` to `true` if you prefer [path-style URL access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/VirtualHosting.html#path-style-access).

## II. Set up Applier configuration
Follow the instructions in [Applier configuration for Amazon S3]({{< relref "amazon-s3#ii-set-up-applier-configuration" >}}).