---
pageTitle: Azure Key Vault
title: Azure Key Vault
description: "Learn how Arcion can retrieve secrets from Azure Key Vault using some simple configuration parameters."
---

# Use Azure Key Vault with Arcion
[Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault) offers cloud service for storing and accessing secrets such as usernames, passwords, and various database credentials.

This page discusses how Arcion works with Azure Key Vault and the configuration for accessing the secrets.

## Overview
Arcion uses the concept of [namespaces](#namespaces) to authenticate with Azure Key Vault and access secrets in key vaults. You can define multiple namespaces, and have access to multiple key vaults and the secrets in those key vaults.

## The secrets management configuration file
You can optionally choose to use a YAML configuration file that specifies details about the secrets and how to retrieve them. The configuration file contains the following parameters:

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
