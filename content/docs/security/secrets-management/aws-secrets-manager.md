---
pageTitle: AWS Secrets Manager
title: AWS Secrets Manager
description: "Learn how Arcion can retrieve secrets from AWS Secrets Manager using some simple configuration parameters."
---

# Use AWS Secrets Manager with Arcion
[AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) works as a key-value store for secrets like passwords, tokens, and various database connection credentials. AWS encrypts these secrets with the AWS Key Management Service (AWS-KMS).

This page discusses how Arcion works with AWS Secrets Manager and configurations for different authentication methods. You can choose what method Arcion uses to retrieve the necessary secrets for your replication pipelines.

## Overview
Arcion uses the concept of [namespaces](#namespaces) to allow different authentication methods with AWS Secrets Manager. Depending on the parameters you specify, you can choose how Arcion establishes an authenticated connection with AWS Secrets Manager and retrieves secrets.

### Authentication methods
Arcion supports the following three authentication methods:

#### Cross-account access using IAM role with IAM user access keys
In this method, the IAM user you specify uses [temporary credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html) to access AWS Secrets Manager and fetches the secrets. You can also use this method for cross-account access. Cross-account access means allowing users in one account to access secrets in another account.

To use this method, specify the IAM user's credentials in the following manner for a namespace:

```YAML
namespaces:
  dbConnection:
    secret-key: IAM_USER_SECRET_ACCESS_KEY
    access-key: IAM_USER_ACCESS_KEY_ID
    role-arn: IAM_ROLE_ARN
    session-name: SESSION_NAME
    region: AWS_REGION
```

Replace the following:

- *`IAM_USER_SECRET_ACCESS_KEY`*: the secret access key for the IAM user—for example, `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- *`IAM_USER_ACCESS_KEY_ID`*: the access key ID for the IAM user—for example, `AKIAIOSFODNN7EXAMPLE` 
- *`IAM_ROLE_ARN`*: the Amazon Resource Name (ARN) of the IAM role
- *`SESSION_NAME`*: the role session name
- *`AWS_REGION`* the AWS region—for example, `us-east-1`

#### Cross-account access using IAM role with default credentials
In this method, you don't need to specify the IAM user's access keys explicitly in the secrets management configuration file. Rather, Arcion searches for the necessary credentials in these locations:

- The `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables. We recommend setting these variables.
- The `aws.accessKeyId` and `aws.secretKey` Java system properties.
- Web identity token from the environment or container.
- The shared [`credentials` file in the default location](https://docs.aws.amazon.com/sdkref/latest/guide/file-location.html).
- The Amazon ECS container credentials. The `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` system environment variable must be set and Secrets Manager must have the permission to access the variable.
- Amazon EC2 instance IAM role-provided credentials through the Amazon EC2 metadata service. 

To use this method, specify the namespace in the following manner:

```YAML
namespaces:
  dbConnection2:
    role-arn: IAM_ROLE_ARN
    session-name: SESSION_NAME
    region: AWS_REGION
```

Replace the following:
 
- *`IAM_ROLE_ARN`*: the Amazon Resource Name (ARN) of the IAM role
- *`SESSION_NAME`*: the role session name
- *`AWS_REGION`* the AWS region—for example, `us-east-1`

#### Access with IAM user credentials
In this method, the IAM user you specify has direct access to Secrets Manager and the secrets.

```YAML
namespaces:
  metadataConnection:
    secret-key: IAM_USER_SECRET_ACCESS_KEY
    access-key: IAM_USER_ACCESS_KEY_ID
    region: AWS_REGION
```

Replace the following:

- *`IAM_USER_SECRET_ACCESS_KEY`*: the secret access key for the IAM user—for example, `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- *`IAM_USER_ACCESS_KEY_ID`*: the access key ID for the IAM user—for example, `AKIAIOSFODNN7EXAMPLE` 
- *`AWS_REGION`* the AWS region—for example, `us-east-1`

## The secrets management configuration file
You can optionally choose to use a YAML configuration file that specifies details about the secrets and how to retrieve them. The configuration file contains the following parameters:

### `type`
The secrets management service you're using. For Amazon Secrets Manager, set this to `AWS`.

### `use-password-rotation`
`{true|false}`.

Enables or disables password rotation.

_Default: `false`._

### `cache-refresh-max-retries`
The maximum number of cache retries Replicant performs to retrieve secrets from AWS Secrets Manager caching system.

_Default: `20`._

### `namespaces`
Contains the following details: 
- The secret name in AWS Secrets Manager. 
- The credentials necessary to access the secrets.

Arcion considers the first part of the secret name a namespace. For example, consider the following two names and how Arcion interprets the corresponding namespaces in the secrets URI and the secrets management configuration file:

| Secret name                   | Namespace     |
| -----------                   | -----------   |
| `mysql_src`                   | `mysql_src`   |
| `mysql_prod/connection`       | `mysql_prod`  |  

For example:

```YAML
namespaces:
  mysql_src:
    secret-key: wJalrXUtnFEMI
    access-key: AKIAIOSFODNN7EXAMPLE
    region: us-east-1
```

To learn how to define namespace for different authentication methods to access Secrets Manager, see [Authentication methods](#authentication-methods).