---
pageTitle: Secrets management
title: Secrets Management
description: "Arcion natively integrates with AWS Secrets Manager and Azure Key Vault, allowing you to securely and effectively manage secrets."
bookCollapseSection: true
bookHidden: true
bookSearchExclude: true
---

# Secrets management
Secrets management allows you to protect sensitive information like passwords, keys, tokens, and so on. To ensure effective and secure secrets management for enterprises, Arcion natively supports the following secrets management services:

- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault)

## Overview
This page guides you through the general steps to access and retrieve secrets from AWS Secrets Manager or Azure Key Vault using Arcion Replicant. 

Replicant works seamlessly with both Secrets Manager and Key Vault. This means you don't need to _separately run_ Replicant to fetch your secrets. Replicant automatically fetches the credentials necessary according to your specifications to establish connection with source and target databases and carries out the replication.

## Step 1: Configure the secrets management details
Replicant requires an optional configuration file containing all the details about secrets management. The configuration file specifies the following details:

- The secrets management service you want to use: AWS Secrets Manager or Azure Key Vault.
- 
