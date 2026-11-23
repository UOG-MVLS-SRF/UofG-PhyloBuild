# PhyloBuild

PhyloBuild is a web tool that builds an annotated maximum-likelihood phylogenetic tree and a gene presence/absence heatmap from assembled bacterial genomes, with optional antimicrobial resistance (AMR) and virulence screening. Most users can use it directly at https://phylotree.srf.gla.ac.uk without installing anything; the instructions below are for running your own instance.

This is the code base for the updated PhyloBuild project, hosted at https://phylotree.srf.gla.ac.uk by the University of Glasgow.

## Requirements
- Docker
- Docker Compose

## Installation
The PhyloBuild project should be built using the simplified_build.sh 

Installation steps:
- Clone the github repository
    ``` git clone https://github.com/UOG-MVLS-SRF/UofG-PhyloBuild.git ```
- Edit the env_example file as appropriate and save as .env.dev
- Run the installation script from the cloned directory
    ``` bash ./simplified_build.sh ```

This will create the requisite docker containers, which can then be run on your server of choice.

Deployment steps:
- Edit the env_example file as appropriate and save as .env.server
- Pull genome libraries from the Git Large File System
    ```git lfs pull```
- Run the deployment script
    ``` bash ./deploy.sh ```

## Adding preloaded genomes
Extra genomes can be manually added to the saved set. Just place these genomes in the genome_library folder, give them a name and accession number in the metadata.csv file, and run deploy.sh again.

## Licence
PhyloBuild is released under the MIT licence (see LICENSE). Third-party components keep their own licences: ClermonTyping (GPL-3.0) and ALTER (LGPL). The VFDB database is subject to its own terms of use.

## Contact
For any issues, please feel free to note these on the repository, or get in touch at andrew.gillen@glasgow.ac.uk
