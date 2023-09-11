---
pageTitle: Secrets management
title: Secrets Management
description: "Arcion natively integrates with AWS Secrets Manager and Azure Key Vault, allowing you to securely and effectively manage secrets."
bookCollapseSection: true
---

# Secrets management
This page guides you through the general steps to access and retrieve secrets from AWS Secrets Manager or Azure Key Vault using Arcion Replicant. 

## Overview
Secrets management allows you to protect sensitive information like passwords, keys, tokens, and so on. To ensure effective and secure secrets management for enterprises, Arcion natively supports the following secrets management services:

- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault)

Replicant works seamlessly with both AWS Secrets Manager and Azure Key Vault. When you start a replication job, specify the necessary options for using a secrets management service. This means you _don't need to separately run_ Replicant to fetch secrets. Replicant automatically fetches the necessary credentials for a replication job according to your specifications.

## Use a secrets management service
Follow these steps to use a secrets management service with Arcion Replicant in a replication job:

### Configure secrets management details
Replicant requires an optional configuration file containing all the details about secrets management. The configuration file specifies the following details:

- The secrets management service you want to use: AWS Secrets Manager or Azure Key Vault.
- Password rotation and the number of secrets cache retries
- Authentication credentials and secret details 

For more information about the secrets management configuration file, see [Use AWS Secrets Manager]({{< relref "aws-secrets-manager" >}}) and [Use Azure Key Vault]({{< relref "#" >}}).

### Specify secrets URI in the connection configuration file
To locate and access a secret in AWS Secrets Manager or Azure Key Vault, Arcion uses the following URI format for each secret:

```
arcion-sm://NAMESPACE/KEY
```

The preceding URI structure contains the following elements:

- *`NAMESPACE`* represents the secret name in AWS Secrets Manager, or the key vault name in Azure Key Vault. Replace *`NAMESPACE`* with the namespace name you specify under the `namespaces` field of the secrets management configuration file. For more information, see the [description of `namespaces`]({{< relref "aws-secrets-manager#namespaces" >}}).
<!--   Arcion considers the first part of the secret name or key vault name a namespace. For example, consider the following two names and how Arcion interprets the corresponding namespaces in the secrets URI and the secrets management configuration file:

  | Secret name or key vault name | Namespace     |
  | -----------                   | -----------   |
  | `mysql_src`                   | `mysql_src`   |
  | `mysql_prod/connection`       | `mysql_prod`  |  
 -->
- *`KEY`*, for AWS Secrets Manager, represents the key of the secret whose value Arcion must retrieve. For Azure Key Vault, *`KEY`* represents the secret name whose value which Arcion must retrieve.
  
The following sample connection configuration file for a [source MySQL]({{< ref "docs/sources/source-setup/mysql" >}}) specifies the `host`, `port`, `username`, and `password` credentials using secrets URI:

```YAML
type: MYSQL

host: arcion-sm://mysql_src/host
port: arcion-sm://mysql_src/port
username: arcion-sm://mysql_src/username
password: arcion-sm://mysql_src/password

slaveServerIds: [1]
maxConnections: 20

maxRetries: 10
retryWaitDurationMs: 1000
```

### Run Replicant
Run Replicant with the following options:

<dl class="dl-indent">
<dt>

`--use-sm-provider`
</dt>
<dd>

Specifies the secrets management service you want to use:

<dl clsss="dl-indent">
<dt>

`AWS`
</dt>
<dd>
Use AWS Secrets Manager as the secrets management service.
</dd>
<dt>

`AZURE`
</dt>
<dd>
Use Azure Key Vault as the secrets management service.
</dd>
<dt>

`NONE`
</dt>
<dd>
Replicant expects credentials to be in plain text in the configuration file. Therefore, Replicant doesn't look for credentials in any secrets management service.</dd>
</dl>
</dd>

<dt> 

`--secret-manager`
</dt>
<dd>
The secrets management configuration file in YAML format.
</dd>
</dl>

For example, the following command [tests the connection]({{< ref "docs/running-replicant#test-connection" >}}) to a MySQL server using secrets from AWS Secrets Manager:

```sh
./bin/replicant test-connection conf/conn/mysql.yaml \
--validate conf/validate/validate.yaml \
--use-sm-provider AWS \
--secret-manager conf/secretmanager/aws_example.yaml
```