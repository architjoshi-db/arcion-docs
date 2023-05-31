---
pageTitle: Set up Amazon S3 as target
title: Amazon S3
description: "Eficiently move data into Amazon S3 using Arcion. Learn about S3 file format, secure connection, and applier configuration for real-time operations."
url: docs/target-setup/s3/amazon-s3
bookHidden: false
---

# Destination Amazon S3

The following steps refer [the extracted Arcion self-hosted CLI download]({{< ref "docs/quickstart/arcion-self-hosted#download-replicant-and-create-replicant_home" >}}) as the `$REPLICANT_HOME` directory.

## I. Set up connection configuration

1. From `$REPLICANT_HOME` navigate to the sample S3 connection configuration file
    ```BASH
    vi conf/conn/s3.yaml
    ```

2. If you store your connection credentials in AWS Secrets Manager, you can tell Replicant to retrieve them. For more information, see [Retrieve credentials from AWS Secrets Manager]({{< ref "docs/security/secrets-manager" >}}). 
    
    Otherwise, you can put your credentials like usernames and passwords in plain form like the sample below:
    ```YAML
    type: S3

    access-key: "REPLICANT" #Replace REPLICANT with the access key of AWS user created from IAM management
    secret-key: "Replicant#123" #Replace Replicant#123 with the secret Key of the AWS User (note: make sure the specified user has  AmazonS3FullAccess)

    bucket: "bucket_name" #Replace bucket_name with the name of your S3 bucket
    root: "root_dir" #Replace root_dir with the name of the directory inside the s3 bucket where the CSV files will be stored

    stage:
      type: SHARED_FS
      root-dir: /home/user/stage #Enter the path of the directory where CSV files will be staged before uploading to S3

    #file-format: CSV #Possible file formats are CSV or JSON
    max-connections: 50 #Maximum number of connections Replicant can open in the target s3
    ```

## II. Set up Applier configuration

1. From `$REPLICANT_HOME` navigate to the sample S3 applier configuration file
    ```BASH
    vi conf/dst/s3.yaml        
    ```

2. If necessary, make the necessary changes as follows:
    ```YAML
    snapshot:
      #threads: 16
      #max-file-size: 33_554_432 #32MB
      #delimiter: `,` #CSV files created will have provided delimiter
      #quote: `”`
      #escape:   `\`
      #include-header: false #enable or disable toggle column names as header in CSV file

    #realtime:
      #threads: 16
    ```

## III. S3 file format

When Replicant loads data into S3, Replicant first converts the data to either a CSV or JSON file. To better understand the data format for the CSV and JSON converted files, see [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}).

{{< hint "warning" >}} 
**Important:** We highly recommended that you read the [Arcion Internal CDC Format for Amazon S3]({{< ref "docs/references/cdc-format/arcion-internal-cdc-format" >}}) page when using S3 as the target system.
{{< /hint >}}