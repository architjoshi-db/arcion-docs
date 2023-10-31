---
pageTitle: Migrate data from Cloud SQL for PostgreSQL to BigQuery
title: Migrate data from Cloud SQL for PostgreSQL to BigQuery
description: "This tutorial walks you through the steps required to migrate data from Cloud SQL for PostgreSQL to BigQuery using Arcion."
---

# Migrate data from Cloud SQL for PostgreSQL to Google BigQuery
This tutorial walks you through the required steps to migrate data from Cloud SQL for PostgreSQL to BigQuery using Arcion.

## Before you begin
1. If you're new to Google Cloud, [create an account](https://console.cloud.google.com/freetrial). You can avail the 90-day free trial for the Google Cloud account using a credit or debit card.
2. [Install the Google Cloud CLI](https://cloud.google.com/sdk/docs/install). If you use a Debian or Ubuntu system, then you can follow the instructions in [Install Google Cloud CLI in Debian and Ubuntu systems](#install-google-cloud-cli-in-debian-and-ubuntu). After installing, [initialize](https://cloud.google.com/sdk/docs/initializing) `gcloud` CLI:
    ```sh
    gcloud init
    ```
3. In the Google Cloud console, on the project selector page, select or create a [Google Cloud project](https://cloud.google.com/resource-manager/docs/creating-managing-projects).
4. If you are on Windows OS, [install Windows Subsystem for Linux (WSL)](https://learn.microsoft.com/en-us/windows/wsl/install). This tutorial uses the `wsl2` terminal.

### Install Google Cloud CLI in Debian and Ubuntu 
Follow these instructions if you want to install Google Cloud CLI in Debian and Ubuntu systems.

#### Before you begin
1. Update package repositories:
    ```sh
    sudo apt-get update
    ```
2. Install [`apt-transport-https`](https://packages.debian.org/bullseye/apt-transport-https) and `curl`:
    ```sh
    sudo apt-get install apt-transport-https ca-certificates gnupg curl sudo
    ```

#### Installation
1. Add the `gcloud` CLI distribution URI as the package source:
    ```sh
    echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
    ```
2. Import the Google Cloud public key:
    ```sh
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
    ```
3. Update and install the `gcloud` CLI:
    ```sh
    sudo apt-get update && sudo apt-get install google-cloud-cli
    ```
4. Initialize `gcloud` CLI to get started:
    ```sh
    gcloud init --console-only
    ```
    After running the `init` command, the browser opens a link containing an authorization code. Copy and paste the authorization code into the terminal.
5. Select the project you want to set up TAU T2A VM and SQL instances for. To see the list of projects, run `gcloud projects list`. To set the default project for your account, run the following:
    ```sh
    gcloud config set project PROJECT_ID
    ```

    Replace *`PROJECT_ID`* with the Google Cloud project ID for your account.
6. Create a service account associated with your Google Cloud account to use and manage services on the Google Cloud:
    ```sh
    gcloud iam service-accounts create <name> --display-name="<display-name>"
    ```
    <ol type="a">
    <li> 

    To get the list of service accounts associated with your project, use `gcloud iam service-accounts list`. Use `gcloud auth list` to get the list of accounts associated with your Google Cloud account.
    </li>

    <li>
    
    Generate a JSON key file associated with your service and save it to your desired location. This file is used for authentication. For example, the following creates `keyfile.json` in the `/home/alex directory`:
      
      ```sh
      gcloud iam service-accounts keys create /home/alex/keyfile.json --iam-account <service-account>
      ```
    </li>
    </ol>

### Set the region and zone
Run the following commands using `glcoud` CLI to set the region to `us-central1` and zone to `us-central1-a`:

```sh
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a
```

For more information, see [Set a default region and zone](https://cloud.google.com/compute/docs/gcloud-compute#set_default_zone_and_region_in_your_local_client).

### Get Arcion self-hosted CLI
1. Arcion self-hosted CLI comes as a ZIP file that you must download. [Contact us](http://www.arcion.io/contact) to get access to the self-hosted ZIP and license file.
2. Once you have access to the ZIP file, download it to the directory of your choice and unzip it. Unzipping the archive creates a directory `replicant-cli`. You can find the Replicant binary in `replicant-cli/bin/` directory.

## Step 1: Set up Tau T2A virtual machine instance
Tau T2A virtual machines (VMs) in the `us-central1` region are available for a free trial until March 31, 2024. For more information, see [Tau T2A free trial](https://cloud.google.com/compute/docs/instances/create-arm-vm-instance#t2afreetrial).

Follow these steps to set up the T2A VM instance for this tutorial.

### Authentication and required permissions
To authenticate to the VM instance, you use the credentials of the service account attached to the VM instance. You must also grant the following roles to your Google account to create and manage the VM instances:  

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

### Set up VM instance
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

1. Get [Arcion self-hosted CLI](#get-arcion-self-hosted-cli). 
2. Copy the Replicant binary and license files from your local machine and upload them to your VM:
    ```sh
    gcloud compute scp --recursive LOCAL_FILE_PATH VM_NAME:REMOTE_DIRECTORY
    ```

    Replace the following:

    - *`LOCAL_FILE_PATH`*: the path to the Replicant binary or license file on your local machine
    - *`VM_NAME`*: the name of your VM
    - *`REMOTE_DIR`*: a directory on the remote VM
3. Install JDK 8 if you don't have it already:
    ```sh
    sudo apt-get update
    sudo apt install openjdk-8-jdk
    ```
4. To verify that you've successfully set up Arcion, check the Replicant version:
    ```sh
    ./bin/replicant version
    ```

    If you get `replicant exited with error code: 0` at the end of the output text, you've successfully set up Arcion in your VM.

## Step 3: Set up Google BigQuery
### Required permissions
To be able to make datasets under your project name, you must have [`roles/bigquery.admin` IAM role](https://cloud.google.com/bigquery/docs/access-control#bigquery.admin) associated with your service account. Ask your admin to grant you the role. If you have admin access, follow these steps:

1. Switch to the admin account: 

    ```sh
    gcloud config set account ACCOUNT
    ```

    Replace the *`ACCOUNT`* with the full email address of the account.

2. Grant the `roles/bigquery.admin` IAM role:
    ```sh
    gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_NAME" \
    --role=roles/bigquery.admin
    ```

    Replace the following:

    - *`PROJECT_ID`*: the project ID where you have created the service account
    - *`SERVICE_ACCOUNT_NAME`*: the name of the service account

Make sure you switch back to your service account later after completing the preceding steps.

### Setup instructions
1. [Create a new dataset](https://cloud.google.com/bigquery/docs/datasets#bq):
    ```sh
    bq mk DATASET_NAME
    ```

    Replace *`DATASET_NAME`* with your dataset name.
2. To verify that you've successfully created the dataset, use the `bq ls` command. It shows you the list of available datasets under your project.
3. For replication, copy the JSON key file generated in the [sixth step during `gcloud` CLI installation](#install-google-cloud-cli-in-debian-and-ubuntu) to your VM:
    ```sh
    gcloud compute scp PATH_TO_JSON_KEY_FILE VM_NAME:REMOTE_DIR
    ```

    Replace the following:

    - *`PATH_TO_JSON_KEY_FILE`*: the path to the the JSON key file on your local machine
    - *`VM_NAME`*: the name of your VM
    - *`REMOTE_DIR`*: a directory on the remote VM
4. Download the [JDBC driver for Google Big Query in ZIP file](https://storage.googleapis.com/simba-bq-release/jdbc/SimbaJDBCDriverforGoogleBigQuery42_1.2.25.1029.zip). Unzip the file and copy the `GoogleBigQueryJDBC42.jar` JAR file to the `replicant-cli/lib` folder in your VM:
    ```sh
    gcloud compute scp PATH_TO_JDBC_JAR_FILE VM_NAME:REMOTE_DIR/replicant-cli/lib/
    ```

    Replace the following:

    - *`PATH_TO_JDBC_JAR_FILE`*: the path to the `GoogleBigQueryJDBC42.jar` JAR file on your local machine
    - *`VM_NAME`*: the name of your VM
    - *`REMOTE_DIR`*: a directory on the remote VM where the `replicant-cli` folder is located

## Step 4: Set up Cloud SQL for PostgreSQL instance
### Required permissions
To create and manage SQL instances in your Google Cloud environment, you must have [`roles/cloudsql.admin` IAM role](https://cloud.google.com/sql/docs/mysql/iam-roles) associated with your service account. Ask your admin to grant you the role. If you have admin access, follow these steps:

1. Switch to that account:

    ```sh
    gcloud config set account ACCOUNT
    ```

    Replace the *`ACCOUNT`* with the full email address of the account.

2. Grant the `roles/cloudsql.admin` IAM role:
    ```sh
    gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_NAME" \
    --role=roles/bigquery.admin
    ```

    Replace the following:

    - *`PROJECT_ID`*: the project ID where you have created the service account
    - *`SERVICE_ACCOUNT_NAME`*: the name of the service account

Make sure you switch back to your service account later after completing the preceding steps.

### Setup instructions
1. Create a PostgreSQL database instance using [`gcloud sql instances create`](https://cloud.google.com/sdk/gcloud/reference/sql/instances/create):
    ```sh
    gcloud sql instances create INSTANCE_NAME \
    --database-version=DATABASE_VERSION \
    --cpu=VCPU_NUMBER --memory=MEMORY \
    --region=us-central1
    ```

    Replace the following:

    - *`INSTANCE_NAME`*: name of the Cloud SQL for PostgreSQL instance
    - *`DATABASE_VERSION`*: the PostgreSQL database version—for example, `POSTGRES_14`
    - *`VCPU_NUMBER`*: the number of vCPUs
    - *`MEMORY`*: the memory size

    The following restrictions apply to values of vCPUs and memory size:
    
    - CPUs must be either 1 or an even number between 2 and 96.
    - Memory must be:
        - 0.9 to 6.5 GB per CPU
        - A multiple of 256 MB
        - At least 3.75 GB

    For more information, see [Create Cloud SQL for PostgreSQL instances](https://cloud.google.com/sql/docs/postgres/create-instance).
2. Create the password for the default `postgres` user:
    ```sh
    gcloud sql users set-password postgres \
    --instance INSTANCE_NAME \
    --password PASSWORD
    ```

      Replace the following:

      - *`INSTANCE_NAME`*: the name of the instance
      - *`PASSWORD`*: the password for the user
3. To connect to your instance, install the `psql` PostgreSQL client that ships with the PostgreSQL server:
    ```sh
    sudo apt-get update
    sudo apt install postgresql
    ```
4. Connect to your Cloud SQL for PostgreSQL instance:
    ```sh
    gcloud sql connect INSTANCE_NAME --user=postgres
    ```

    Replace *`INSTANCE_NAME`* with your instance name.
5. To allow connection from your VM, whitelist the IP address of the VM in your database instance:
    ```sh
    gcloud sql instances patch INSTANCE_NAME --authorized-networks=VM_IP
    ```

    Replace the following:

    - *`INSTANCE_NAME`*: the name of your instance
    - *`VM_IP`*: the IP address of your VM
6. To start, stop, or restart your instance, change the [activation policy](https://cloud.google.com/sql/docs/mysql/start-stop-restart-instance#activation_policy):
    {{< tabs "start-stop-restart-instance" >}}
    {{< tab "Start instance" >}}
  To start an instance, use `ALWAYS` for the activation policy:
  ```sh
  gcloud sql instances patch INSTANCE_NAME --activation-policy=ALWAYS
  ```

  Replace *`INSTANCE_NAME`* with your instance name.
    {{< /tab>}}
    {{< tab "Stop instance" >}}
  To stop an instance, use `NEVER` for the activation policy:
  ```sh
  gcloud sql instances patch INSTANCE_NAME --activation-policy=NEVER
  ```

  Replace *`INSTANCE_NAME`* with your instance name.
    {{< /tab >}}
    {{< tab "Restart instance" >}}
  To restart an instance, use the `restart` command:
  ```sh
  gcloud sql instances restart INSTANCE_NAME
  ```

  Replace *`INSTANCE_NAME`* with your instance name.
    {{< /tab >}}
    {{< /tabs>}}
7. To get information about your instance, use the `describe` command:
    ```sh
    gcloud sql instances describe INSTANCE_NAME
    ```

    Replace *`INSTANCE_NAME`* with your instance name.

## Step 5: Configure Cloud SQL for PostgreSQL instance
To enable real-time data replication from Cloud SQL for PostgreSQL, follow these steps to configure your instance:

1. PostgreSQL supports logical decoding by writing additional information to its write-ahead log (WAL). To enable this feature, set the `cloudsql.logical_decoding` flag to `on` and set the maximum number of replication slots.

    ```sh
    gcloud sql instances patch INSTANCE_NAME \
    --database-flags=cloudsql.logical_decoding=on,max_replication_slots=10
    ```

    Replace *`INSTANCE_NAME`* with your instance name.
2. To perform log consumption for change data capture (CDC) replication from the PostgreSQL server, you must use a logical decoding plugin:
    - `test_decoding`
    - `wal2json`

    This tutorial uses `wal2json`. This plugin is pre-installed in Cloud SQL for PostgreSQL.

    <ol type="a">
    <li>

    Assign the `replication` role to the current user:
    ```sql
    ALTER USER postgres WITH replication;
    ```
    To create a specific user for replication,  follow the instructions in [Create a user in PostgreSQL]({{< ref "docs/sources/source-setup/postgresql#i-create-a-user-in-postgresql" >}}). In this tutorial, we use the default `postgres` user to keep things simple. 
    </li>
    <li>

    Create a logical replication slot:
    ```sql
    SELECT 'init' FROM pg_create_logical_replication_slot('<slot_name>', 'wal2json');
    ```

    To see the list of replication slots, run the following command:
    ```sql
    SELECT * FROM pg_replication_slots;
    ```

    You can create more replication slots as long it doesn't exceed the maximum number you specify in the first step.

    </li>
    </ol>

## Step 6: Configure Arcion
For a simple data replication, you must configure the following:

- Connection details for source and target databases
- Extractor for source
- Filter

In this tutorial, Cloud SQL for PostgreSQL is the source and Big Query the target.

First, connect to the VM and navigate to the `replicant-cli` folder:
```sh
#connect to the vm
gcloud compute ssh --project=PROJECT_ID --zone=ZONE VM_NAME

#navigate to the folder
cd replicant-cli
```

Replace the following:
- *`PROJECT_ID`*: the project ID where you have created the service account
- *`ZONE`*: the name of the zone that the VM is located in
- *`VM_NAME`*: the name of your VM

Then follow these instructions:

### Configure connection details for source and target database
1. Navigate to the `replicant-cli/conf/conn/postgresql_src.yaml` sample connection configuration for [PostgreSQL source]({{< ref "docs/sources/source-setup/postgresql" >}}).
    ```YAML
    type: POSTGRESQL

    host: IP
    port: PORT_NUMBER

    database: 'DATABASE_NAME'
    username: 'USERNAME'
    password: 'PASSWORD'

    max-connections: 30
    socket-timeout-s: 60
    max-retries: 10
    retry-wait-duration-ms: 1000

    replication-slots:
      SLOT_NAME:
        - wal2json
    ```

    Replace the following:

   - *`IP`*: the IP address of the Cloud SQL for PostgreSQL instance
   - *`PORT_NUMBER`*: the port number
   - *`DATABASE_NAME`*: the PostgreSQL database name
   - *`USERNAME`*: the database username 
   - *`PASSWORD`*: the password associated with *`USERNAME`*
   - *`SLOT_NAME`*: the [replication slot]({{< ref "docs/sources/source-setup/postgresql#replication-slots" >}}) name

   Feel free to change the following parameter values as you need:

    - *`max-connections`*: the maximum number of connections Replicant opens in Cloud SQL instance
    - *`max-retries`*: number of times Replicant retries a failed operation
    - *`retry-wait-duration-ms`*: duration in milliseconds Replicant waits between each retry of a failed operation.
    - *`socket-timeout-s`*: the timeout value in seconds specifying socket read operations. A value of `0` disables socket reads.

    {{< hint "warning" >}}
  **Important:** Make sure that the [`max_connections` number in Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres/quotas#maximum_concurrent_connections) exceeds the `max-connections` number in the preceding connection configuration file.
    {{< /hint >}}

2. Navigate to the `replicant-cli/conf/conn/bigquery_dst.yaml` sample connection configuration for [BigQuery target]({{< ref "docs/targets/target-setup/bigquery" >}}).
    ```YAML
    type: BIGQUERY

    host: https://www.googleapis.com/bigquery/v2
    port: PORT_NUMBER
    project-id: PROJECT_ID
    auth-type: 0
    o-auth-service-acc-email: SERVICE_ACCOUNT_WITH_ADMIN_ROLE
    o-auth-pvt-key-path: PATH_TO_JSON_CREDENTIALS_FILE
    location: US
    timeout: 500
    max-connections: 20
    max-retries: 10
    retry-wait-duration-ms: 1000
    ```

     Replace the following:

   - *`PORT_NUMBER`*: the port number
   - *`PROJECT_ID`*: BigQuery project ID
   - *`SERVICE_ACCOUNT_WITH_ADMIN_ROLE`*: the service account name possessing the `roles/bigquery.admin` IAM role
   - *`PATH_TO_JSON_CREDENTIALS_FILE`*: path to your JSON credentials file you generate when installing `gcloud` CLI. For more information, see [step 6b in Install Google Cloud CLI in Debian and Ubuntu](#install-google-cloud-cli-in-debian-and-ubuntu).

### Configure Extractor for source
Navigate to the sample Extractor configuration `replicant-cli/conf/src/postgresql.yaml`:

#### Configure `snapshot` mode
```YAML
snapshot:
  threads: 16
  fetch-size-rows: 5_000
  per-table-config:
  - catalog: demo #database-name
    schema: public #schema-name
    tables:
      usertable:   #table-name
        split-key: ycsb_key #primary-key
```

The preceding sample defines uses `snapshot.per-table-config` to define table-specific configurations. For example, the `usertable` table under `public` schema and `demo` catalog.

For more information about the configuration parameters for `snapshot` mode, see [Snapshot mode]({{< ref "docs/sources/configuration-files/extractor-reference#snapshot-mode" >}}).

#### Configure `realtime` mode
1. First, create a heartbeat table in your source Cloud SQL for PostgreSQL instance:
    ```sh
    CREATE TABLE "DATABASE"."SCHEMA"."replicate_io_cdc_heartbeat"("timestamp" BIGINT NOT NULL, PRIMARY KEY("timestamp"))
    ```

    Replace *`DATABASE`* and *`SCHEMA`* with the database name and schema name respectively.

2. Specify the parameters for real time replication under `realtime` field. For example:
    ```YAML
    realtime:
      threads: 4
      fetch-size-rows: 10000
      fetch-duration-per-extractor-slot-s: 3
      _traceDBTasks: true
      heartbeat:
        enable: true
        catalog: demo
        schema: public
        interval-ms: 10000
    ```

For more information about the configuration parameters for `realtime` mode, see [Realtime mode]({{< ref "docs/sources/configuration-files/extractor-reference#realtime-mode" >}}).

### Configure filter (optional)
If you want to filter data from your source Cloud SQL for PostgreSQL database, specify the filter rules in the filter file. You can find a sample filter file `postgresql_filter.yaml` in the `replicant-cli/filter/` directory. 

```YAML
allow:
- catalog: "demo"
  schema: "public"
  types: [TABLE]
  allow:
    CUSTOMERS:
    ORDERS:
```

The preceding configuration defines the following filter rules:

- Data of object type `TABLE` in the database `demo` and the schema `public` goes through replication.
- From the `demo` database, only the `CUSTOMERS` and `ORDERS` tables go through replication.

For a more complicated filter example, see [Set up filter configuration]({{< ref "docs/sources/source-setup/postgresql#set-up-filter-configuration-optional" >}}) in PostgreSQL source documentation.

For more information about filter rules in general, see [Filter configuration]({{< ref "docs/sources/configuration-files/filter-reference" >}}).

## Step 7: Start the replication
Arcion can run the replication in three [modes]({{< ref "docs/running-replicant" >}}): 
- `snapshot`
- `realtime`
- `full`

Use the following command to run Replicant in [`full`]({{< ref "docs/running-replicant#replicant-full-mode" >}}) mode to start the replication process. Full mode replication combines snapshot and real time replication schemes.

```sh
./bin/replicant full \
conf/conn/postgresql_src.yaml conf/conn/bigquery_dst.yaml \
--extractor conf/src/postgresql.yaml \
--filter filter/postgresql_filter.yaml \
--replace-existing --overwrite
```