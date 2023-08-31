---
pageTitle: Install and set up Arcion On-premises UI
title: Installation and Setup
description: "Learn how to install and set up Arcion On-premises UI."
weight: 1
---

# Install and set up Arcion On-premises UI
This guide walks you through the necessary steps to get Arcion’s On-premises UI up and running in your network.

If you're using AWS, GCP, Azure, or some other cloud vendor virtual machine (VM) instance, make sure you have network access to and from your source and target databases or data lakes.

## Prerequisites
Before you install and set up Arcion On-premises UI, complete the following prerequisites:

### Hardware prerequisites
Ensure a cloud, VM, or bare metal server instance. The server must meet the minimum resources the Arcion team recommends for your specific workload. For most small and proof of concept environments with 10 or less tables, make sure the environment meets the following resources:

- 4 virtual CPUs (vCPU)
- 16 GB of RAM
- 200 GB of free storage space

### Software prerequisites
- A Linux operating system—for example, Rocky Linux, Ubuntu, or Red Hat.
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/). For more information, see [Install Docker and Docker Compose](#install-docker-and-docker-compose).

## Environment configuration
In your Linux server, create a folder to hold the Docker Compose file, the Docker volumes, and the necessary directories. You can create this folder anywhere on your server. In this example, we use `/usr/local/arcion` as the folder.

1. Create these folders inside `/usr/local/arcion`:
    ```sh
    sudo mkdir -p /usr/local/arcion/onpremui/data
    sudo mkdir -p /usr/local/arcion/onpremui/config
    sudo mkdir -p /usr/local/arcion/onpremui/libs
    sudo mkdir -p /usr/local/arcion/onpremui/pg
    ```

2. Copy Arcion license file to the `config` directory:
    ```sh
    sudo cp ./replicate.lic /usr/local/arcion/onpremui/config/
    ```
    {{< hint "info" >}}
To request a temporary PoC license file from the Arcion team, [please contact us](https://www.arcion.io/contact).
    {{< /hint >}}

3. Create a Docker Compose file:

    ```sh
    sudo vi /usr/local/arcion/onpremui/docker-compose.yaml
    ```
4. Copy the following into the Compose file:

    ```YAML
    version: '3.3'
    services:
      postgres-database:
        container_name: postgres-database
        environment:
          - POSTGRES_PASSWORD=postgres
        ports:
          - '5432:5432'
        volumes:
          - /usr/local/arcion/onpremui/pg:/var/lib/postgresql/data
        image: postgres:14.8-alpine
      replicant-on-premises:
        container_name: replicant-on-premises
        ports:
          - '8080:8080'
          - '8050:8050'
        depends_on:
          - "postgres-database"
        environment:
          - DB_HOST=postgres-database
          - DB_PORT=5432
          - DB_DATABASE=postgres
          - DB_USERNAME=postgres
          - DB_PASSWORD=postgres
          #- NTP_SERVER=0.pool.ntp.org
          - PROMETHEUS_ENABLE=true
        volumes:
          - /usr/local/arcion/onpremui/data:/data
          - /usr/local/arcion/onpremui/config:/config
          - /usr/local/arcion/onpremui/libs:/libs
        #image: arcionlabs/replicant-on-premises:test
        image: arcionlabs/replicant-on-premises:latest
    ```

    The preceding Compose file creates two containers:
    - The `postgres-database` container
    - The `replicant-on-premises` container

    The `postgres-database` container works to store Arcion’s replication job metadata.
    
    We also forward the following ports for different tasks: 
    - Port `5432` for the PostgreSQL database 
    - Ports `8080` and `8050` for the Replicant web UI 

    {{< hint "info" >}}
  **Note:** In a production environment, the PostgreSQL database in most cases can be a production database with a backup system. In an event where you might need to stop and start the replication jobs from any other Arcion replication server or container, this ensures that Arcion can retain the metadata.
    {{< /hint >}}

## Install Docker and Docker Compose
This following instructions cover both Linux (CentOS/Rocky Linux) and Ubuntu-based operating systems. For other platforms, see [Install Docker engine](https://docs.docker.com/engine/install/).

### Install Docker on Linux

1. Install the following packages:
    ```sh
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

    sudo yum -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```
2. Start Docker:

    ```sh
    sudo systemctl start docker
    ```

### Install Docker on Ubuntu
1. Remove conflicting packages:
    ```sh
    for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done
    ```

2. Update the APT package index and add Docker’s official GPG key:
    ```sh
    sudo apt-get update
    sudo apt-get install ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    ```

3. Set up the repository:
    ```sh
    echo \
    "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
    
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    ```

4. Install Docker Engine:
    ```sh
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```

5. Start Docker:
    ```sh
    sudo systemctl start docker
    ```

## Download required libraries
Arcion's replication software requires some non-redistributable libraries. You must download these libraries separately and place them in the `/usr/local/arcion/onpremui/libs` directory. 

{{< hint "warning" >}}
**Important:** Any time you add a new library file, you must restart the Docker container for Arcion to use the new library.
{{< /hint >}}

The following examples show the targets that Arcion needs libraries for and how to set them up.

### Databricks
#### Download the JDBC drivers
{{< tabs "databricks-jdbc-driver-download" >}}
{{< tab "Legacy Databricks" >}}
1. Set up a temporary directory to work with the library files:
    ```sh
    sudo mkdir -p /usr/local/arcion/onpremui/temp
    cd /usr/local/arcion/onpremui/temp
    ```

2. Download the JDBC 4.2-compatible Databricks JDBC Driver ZIP:
    ```sh
    sudo wget https://databricks-bi-artifacts.s3.us-east-2.amazonaws.com/simbaspark-drivers/jdbc/2.6.22/SimbaSparkJDBC42-2.6.22.1040.zip
    ```

3. From the downloaded ZIP, locate and extract the `SparkJDBC42.jar` file to the `/usr/local/arcion/onpremui/libs` directory:
    ```sh
    sudo unzip /usr/local/arcion/onpremui/temp/SimbaSparkJDBC42-2.6.22.1040.zip
    sudo mv /usr/local/arcion/onpremui/temp/SparkJDBC42.jar /usr/local/arcion/onpremui/libs/
    ```

4. Optionally, clean up the temporary files:
    ```sh
    cd ..
    sudo rm -rf /usr/local/arcion/onpremui/temp
    ```
{{< /tab >}}
{{< tab "Databricks Unity Catalog" >}}
1. Set up a temporary directory to work with the library files:
    ```sh
    sudo mkdir -p /usr/local/arcion/onpremui/temp
    cd /usr/local/arcion/onpremui/temp
    ```

2. Download the Databricks JDBC Driver ZIP:
    ```sh
    sudo wget https://databricks-bi-artifacts.s3.us-east-2.amazonaws.com/simbaspark-drivers/jdbc/2.6.33/DatabricksJDBC42-2.6.33.1055.zip
    ```

3. From the downloaded ZIP, locate and extract the `DatabricksJDBC42.jar` file to the `/usr/local/arcion/onpremui/libs` directory:
    ```sh
    sudo unzip DatabricksJDBC42-2.6.33.1055.zip
    sudo mv /usr/local/arcion/onpremui/temp/DatabricksJDBC42.jar /usr/local/arcion/onpremui/libs/
    ```

4. Optionally, clean up the temporary files:
    ```sh
    cd ..
    sudo rm -rf /usr/local/arcion/onpremui/temp
    ```
{{< /tab >}}
{{< /tabs >}}

#### Download Log4j
1. Set up a temporary directory to work with the library files:
    ```sh
    sudo mkdir -p /usr/local/arcion/onpremui/temp
    cd /usr/local/arcion/onpremui/temp
    ```

2. Download the Apache Log4j ZIP:
    ```sh
    sudo wget https://dlcdn.apache.org/logging/log4j/2.20.0/apache-log4j-2.20.0-bin.zip
    ```
3. From the downloaded ZIP, locate and extract the `log4j-api` and `log4j-core` JAR files to the `/usr/local/arcion/onpremui/libs` directory:
    ```sh
    sudo unzip apache-log4j-2.20.0-bin.zip

    sudo mv /usr/local/arcion/onpremui/temp/apache-log4j-2.20.0-bin/log4j-api-2.20.0.jar /usr/local/arcion/onpremui/libs/

    sudo mv /usr/local/arcion/onpremui/temp/apache-log4j-2.20.0-bin/log4j-core-2.20.0.jar /usr/local/arcion/onpremui/libs/

    sudo mv /usr/local/arcion/onpremui/temp/apache-log4j-2.20.0-bin/log4j-1.2-api-2.20.0.jar /usr/local/arcion/onpremui/libs/
    ```

4. Optionally, clean up the temporary files:
    ```sh
    cd ..
    sudo rm -rf /usr/local/arcion/onpremui/temp
    ```

### Google BigQuery
#### Download the JDBC driver
1. Set up a temporary directory to work with the library files:
    ```sh
    sudo mkdir -p /usr/local/arcion/onpremui/temp
    cd /usr/local/arcion/onpremui/temp
    ```

2. Download the latest JDBC 4.2-compatible JDBC driver ZIP:
    ```sh
    sudo wget https://storage.googleapis.com/simba-bq-release/jdbc/SimbaJDBCDriverforGoogleBigQuery42_1.2.25.1029.zip
    ```

3. From the downloaded ZIP, locate and extract the `GoogleBigQueryJDBC42.jar` file to the `/usr/local/arcion/onpremui/libs` directory:
    ```sh
    unzip SimbaJDBCDriverforGoogleBigQuery42_1.2.25.1029.zip
    sudo mv /usr/local/arcion/onpremui/temp/GoogleBigQueryJDBC42.jar /usr/local/arcion/onpremui/libs/
    ```

4. Optionally, clean up the temporary files:
    ```sh
    cd ..
    sudo rm -rf /usr/local/arcion/onpremui/temp
    ```

#### Download Log4j
1. Set up a temporary directory to work with the library files:
    ```sh
    sudo mkdir -p /usr/local/arcion/onpremui/temp
    cd /usr/local/arcion/onpremui/temp
    ```

2. Download the Apache Log4j ZIP:
    ```sh
    sudo wget https://dlcdn.apache.org/logging/log4j/2.20.0/apache-log4j-2.20.0-bin.zip
    ```

3. From the downloaded ZIP, locate and extract the `log4j-api` and `log4j-core` JAR files to the `/usr/local/arcion/onpremui/libs` directory:
    ```sh
    sudo unzip apache-log4j-2.20.0-bin.zip

    sudo mv /usr/local/arcion/onpremui/temp/apache-log4j-2.20.0-bin/log4j-api-2.20.0.jar /usr/local/arcion/onpremui/libs/

    sudo mv /usr/local/arcion/onpremui/temp/apache-log4j-2.20.0-bin/log4j-core-2.20.0.jar /usr/local/arcion/onpremui/libs/

    sudo mv /usr/local/arcion/onpremui/temp/apache-log4j-2.20.0-bin/log4j-1.2-api-2.20.0.jar /usr/local/arcion/onpremui/libs/
    ```

4. Optionally, clean up the temporary files:
    ```sh
    cd ..
    sudo rm -rf /usr/local/arcion/onpremui/temp
    ```

### Oracle
Download the Oracle JDBC driver `ojdbc8.jar` and place it in the `/usr/local/arcion/onpremui/libs` directory:

```sh
cd /usr/local/arcion/onpremui/libs

sudo wget https://download.oracle.com/otn-pub/otn_software/jdbc/1815/ojdbc8.jar
```

## Start the containers
Before you start the containers, make sure you complete the following steps:

1. Change the variables to suit your requirements in [the Docker Compose file](#environment-configuration).
2. [Place the license file](#environment-configuration) appropriately.
3. Download the [required libraries](#download-required-libraries) and place them appropriately.

To start both of the required containers for the On-premises UI,  run the following commands:

```sh
cd /usr/local/arcion/onpremui
sudo docker compose up -d
sudo docker ps
```