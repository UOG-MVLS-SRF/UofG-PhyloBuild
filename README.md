# PhyloBuild

This is the code base for the updated PhyloBuild project, hosted at http://phylotree.srf.gla.ac.uk by the University of Glasgow

## Requirements
- Docker
- Docker Compose

## Installation
The PhyloBuild project should be built using the simplified_build.sh 

Installation steps:
- Clone the github repository
    ``` git clone https://github.com/UOG-MVLS-SRF/UofG-Phylobuild.git ```
- Edit the .env.template file as appropriate and save as .env.dev
- Run the installation script from the cloned directory
    ``` bash ./simplified_build.sh ```

This will create the requisite docker containers, which can then be run on your server of choice.

Deployment steps:
- Edit the .env.template file as appropriate and save as .env.server
- Pull genome libraries from the Git Large File System
    ```git lfs pull```
- Run the deployment script
    ``` bash ./deploy.sh ```

## Adding preloaded genomes
Extra genomes can be manually added to the saved set. Just place these genomes in the genome_libraries folder, give them a name and accession number in the metadata.csv file, and run deploy.sh again.

## Contact
For any issues, please feel free to note these on the repository, or get in touch at andrew.gillen@glasgow.ac.uk