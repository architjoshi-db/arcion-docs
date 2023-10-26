---
pageTitle: Migrate data from Cloud SQL for PostgreSQL to BigQuery
title: Migrate data from Cloud SQL for PostgreSQL to BigQuery
description: "This tutorial walks you through the steps required to migrate data from Cloud SQL for PostgreSQL to BigQuery using Arcion."
---

# Migrate data from Cloud SQL for PostgreSQL to Google BigQuery

## Before you begin
1. If you're new to Google Cloud, [create an account](https://console.cloud.google.com/freetrial). You can avail the 90-day free trial for the Google Cloud account using a credit or debit card.
2. [Install the Google Cloud CLI](https://cloud.google.com/sdk/docs/install). Then [initialize](https://cloud.google.com/sdk/docs/initializing) it with the following command:
    ```sh
    gcloud init
    ```
3. In the Google Cloud console, on the project selector page, select or create a [Google Cloud project](https://cloud.google.com/resource-manager/docs/creating-managing-projects).
4. If you are on Windows OS, [install Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/install). This tutorial uses the `wsl2` terminal.

### Set the region and zone
Run the following commands using `glcoud` CLI to set the region to `us-central1` and zone to `us-central1-a`:

```sh
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a
```

For more information, see [Set a default region and zone](https://cloud.google.com/compute/docs/gcloud-compute#set_default_zone_and_region_in_your_local_client).


### Set up authentication
This tutorial uses the [Tau T2A Compute Engine virtual machine (VM)](https://cloud.google.com/compute/docs/instances/arm-on-compute). To authenticate to the VM instance, you use the credentials of the service account attached to the VM instance. You must also grant the following roles to your Google account to create and manage the VM instances:  

- [`roles/compute.admin`](https://cloud.google.com/iam/docs/understanding-roles#predefined_roles)
- [`roles/iam.serviceAccountUser`](https://cloud.google.com/iam/docs/service-account-permissions#user-role)

 Ask your Google Cloud admin to grant you the roles. If you are the admin, then follow these steps. Make sure you switch back to your service account after completing these steps:

    
1. Grant full control of all Compute Engine resources for the T2A VMs:

    ```sh
    gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_NAME" \
    --role=roles/compute.admin
    ```

    Replace the following:

    - *`PROJECT_ID`*: the project ID where you have created the service account
    - *`SERVICE_ACCOUNT_NAME`*: the name of the service account

2. Grant the [Service Account User role](https://cloud.google.com/iam/docs/service-account-permissions#user-role):

    ```sh
    gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_NAME" \
    --role=roles/iam.serviceAccountUser
    ```

    Replace the following:

    - *`PROJECT_ID`*: the project ID where you have created the service account
    - *`SERVICE_ACCOUNT_NAME`*: the name of the service account


For more information on authenticating T2A Compute Engine VM, see [Set up authentication for Compute Engine on Google Cloud](https://cloud.google.com/compute/docs/authentication#on-gcp).

## Step 1: Set up Tau T2A virtual machine instance
Tau T2A virtual machines (VMs) in the `us-central1` region are available for a free trial until March 31, 2024. For more information, see [Tau T2A free trial](https://cloud.google.com/compute/docs/instances/create-arm-vm-instance#t2afreetrial).

Follow these steps to set up the T2A VM instance for this tutorial:


1. View the list of [public OS images](https://cloud.google.com/compute/docs/images#gcloud) available for your T2A Compute Engine:

    ```sh
    gcloud compute images list
    ```

2. Choose the appropriate image for your OS. Then use the [`gcloud compute instances create` command](https://cloud.google.com/sdk/gcloud/reference/compute/instances/create) to create an Arm VM:

    ```sh
    gcloud compute instances create VM_NAME \
    --project=PROJECT_ID \
    --zone=us-central1-a \
    --image-project=IMAGE_PROJECT \
    --image=ubuntu-2204-jammy-arm64-v20230919 \
    --network-interface=nic-type=GVNIC \
    --machine-type=t2a-standard-1 \
    ```

    Replace the following:

    - *`VM_NAME`*: [name](https://cloud.google.com/compute/docs/naming-resources#resource-name-format) of the VM 
    - *`PROJECT_ID`*: the project ID where you have created the service account
    - *`IMAGE_PROJECT`*: [project](https://cloud.google.com/compute/docs/images/os-details#general-info) containing the image
    - *`IMAGE`*: specific version of a public image—for example, `ubuntu-2204-jammy-arm64-v20230919`
    - *`MACHINE_TYPE`*: machine type for the new VM—for example, `t2a-standard-1`. To get a list of the machine types available in a zone, use the [`gcloud compute machine-types list` command](https://cloud.google.com/sdk/gcloud/reference/compute/machine-types/list) with the `--zones` flag.

    The preceding command creates the VM instance with [Google Virtual NIC (gVNIC)](https://cloud.google.com/compute/docs/networking/using-gvnic) support.

3. Check the description of the VM:
    ```sh
    gcloud compute instances describe VM_NAME
    ```

4. Establish a SSH connection to your VM:
    ```sh
    gcloud compute ssh --project=PROJECT_ID --zone=ZONE VM_NAME
    ```

    Replace the following:
    - *`PROJECT_ID`*: the project ID where you have created the service account
    - *`ZONE`*: the name of the zone that the VM is located in
    - *`VM_NAME`*: [name](https://cloud.google.com/compute/docs/naming-resources#resource-name-format) of the VM 

    Remember to create a passphrase that can further secure the SSH key every time you try to establish a connection.

5. To get IP addresses of your VM instance, use the following:
    ```sh
    gcloud compute instances list
    ```

6. To start and stop your VM instance, use the [`start`](https://cloud.google.com/sdk/gcloud/reference/compute/instances/start) and [`stop`](https://cloud.google.com/sdk/gcloud/reference/compute/instances/stop) commands of `gcloud compute instances` respectively:
    ```sh
    gcloud compute instances start VM_NAME
    gcloud compute instances stop VM_NAME
    ```

    Replace *`VM_NAME`* with the [name](https://cloud.google.com/compute/docs/naming-resources#resource-name-format) of your VM instance.

## Step 2: Set up Arcion
After [completing the preceding steps](#step-1-set-up-tau-t2a-virtual-machine-instance), you have a T2A VM instance Compute Engine deployed in Google Cloud. Now you need to set up [Arcion self-hosted CLI](https://www.arcion.io/self-hosted) in your VM instance.

1. Arcion self-hosted CLI comes as a ZIP file that you must download. [Contact us](http://www.arcion.io/contact) to get access to the self-hosted ZIP and license file.
2. Once you have access to the ZIP file, download it to the directory of your choice and unzip it. Unzipping the archive creates a directory `replicant-cli`. You can find the Replicant binary in `replicant-cli/bin/` directory. 
3. Copy the Replicant binary and license files from your local machine and upload them to your VM:
    ```sh
    gcloud compute scp --recursive LOCAL_FILE_PATH VM_NAME:REMOTE_DIRECTORY
    ```

    Replace the following:

    - *`LOCAL_FILE_PATH`*: the path to the Replicant binary or license file on your local machine
    - *`VM_NAME`*: the name of your VM
    - *`REMOTE_DIR`*: a directory on the remote VM

