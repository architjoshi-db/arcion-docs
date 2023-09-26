---
pageTitle: Azure Key Vault
title: Azure Key Vault
description: "Learn how Arcion can retrieve secrets from Azure Key Vault."
---

# Use Azure Key Vault with Arcion
[Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault) offers cloud service for storing and accessing secrets such as usernames, passwords, and various database credentials.

Arcion supports Key Vault as a secrets management service from version 23.08.31.1. This page discusses how Arcion works with Azure Key Vault and the configuration for accessing the secrets.

## Overview
Arcion uses the concept of [namespaces](#namespaces) to authenticate with Azure Key Vault and access secrets in key vaults. You can define multiple namespaces, and have access to multiple key vaults and the secrets in those key vaults.

## Authentication with Key Vault
Arcion uses [Azure Active Directory (Azure AD)](https://azure.microsoft.com/en-us/services/active-directory/) authentication to authenticate with Azure Key Vault and access its secrets.

Arcion requires the following credentials to use Azure AD authentication:

Tenant ID
: The unique identifier of the Azure AD instance. Specify the tenant ID with the `tenant-id` parameter in the secrets management configuration file.

Client ID
: [The unique identifier](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration#client-id) Azure AD assigns to Arcion. Specify the client ID with the `client-id` parameter in the secrets management configuration file.

Client secret
: The secret key Arcion uses when communicating with Azure AD. Specify this secret key with the `client-secret` parameter in the secrets management configuration file.

## Configure Key Vault details
You can optionally choose to use a YAML configuration file that specifies details about the secrets and how to retrieve them. Without the the secrets management configuration file, Arcion looks for authentication credentials in environment variables. For more information, see the [**Azure Key Vault** tab in Configure secrets management details]({{< relref "secrets-management#configure-secrets-management-details" >}}).

The configuration file contains the following parameters:

### `type`
The secrets management service you're using. For Azure Key Vault, set this to `AZURE`.

### `use-password-rotation`
`{true|false}`.

Enables or disables password rotation.

_Default: `false`._

### `cache-refresh-max-retries`
The maximum number of cache retries Replicant performs to retrieve secrets from Azure Key Vault caching system.

_Default: `20`._

### `namespaces`
Contains the following details: 
- The key vault name in Azure Key Vault. 
- The credentials necessary to access the secrets.

Arcion considers the first part of the key vault name a namespace. For example, consider the following two names and how Arcion interprets the corresponding namespaces in the secrets URI and the secrets management configuration file:

| Key vault name                | Namespace     |
| -----------                   | -----------   |
| `mysql_src`                   | `mysql_src`   |
| `mysql_prod/connection`       | `mysql_prod`  |  

Under each `namespaces` definition, specify the [authentication credentials](#authentication-with-key-vault) so that Arcion can access the key vault. For example:

```YAML
namespaces:
  mysql_src:
    tenant-id: TENANT_ID
    client-id: CLIENT_ID
    client-secret: CLIENT_SECRET
  mysql_dst:
    tenant-id: TENANT_ID
    client-id: CLIENT_ID
    client-secret: CLIENT_SECRET
```

Replace *`TENANT_ID`*, *`CLIENT_ID`*, and *`CLIENT_SECRET`* with the actual [authentication credentials values](#authentication-with-key-vault).