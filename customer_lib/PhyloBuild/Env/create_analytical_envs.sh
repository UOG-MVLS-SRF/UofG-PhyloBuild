#!/usr/bin/env bash

set -euo pipefail

TOOLS_DIR="/opt/accessory-genome-tools"
PLASCOPE_DB_DIR="${TOOLS_DIR}/PlaScope_DBs"
COPLA_DIR="${TOOLS_DIR}/COPLA"
CONDA_DIR="/opt/conda"

echo "accessory-tools Installing system dependencies..."

apt-get update

apt-get install -y --no-install-recommends \
    bison \
    build-essential \
    cmake \
    default-jre \
    dos2unix \
    flex \
    git \
    libgmp3-dev \
    libgtest-dev \
    libxml-simple-perl \
    unzip \
    wget \
    zlib1g-dev

rm -rf /var/lib/apt/lists/*


# ----------------------------------------------------------------------
# PlaScope
# ----------------------------------------------------------------------

echo "[accessory-tools] Creating PlaScope environment..."

mkdir -p "${PLASCOPE_DB_DIR}"

conda create -y \
    -n plascope \
    -c conda-forge \
    -c bioconda \
    plascope

cd "${PLASCOPE_DB_DIR}"

echo "[accessory-tools] Downloading PlaScope databases..."

wget -4 \
  "https://zenodo.org/records/1311641/files/chromosome_plasmid_db.tar.gz?download=1" \
  -O chromosome_plasmid_db.tar.gz

wget -4 \
  "https://zenodo.org/records/1311647/files/Klebsiella_PlaScope.tar.gz?download=1" \
  -O Klebsiella_PlaScope.tar.gz

mkdir -p chromosome_plasmid_db Klebsiella_PlaScope

tar -xzf chromosome_plasmid_db.tar.gz \
    -C chromosome_plasmid_db

tar -xzf Klebsiella_PlaScope.tar.gz \
    -C Klebsiella_PlaScope

rm -f chromosome_plasmid_db.tar.gz Klebsiella_PlaScope.tar.gz

cd "${TOOLS_DIR}"

# # ----------------------------------------------------------------------
# # accessory-genome environment
# # ----------------------------------------------------------------------

# echo "[accessory-tools] Creating accessory-genome environment..."

# conda create -y \
#     -n accessory-genome \
#     python=3.10


# ----------------------------------------------------------------------
# COPLA
# ----------------------------------------------------------------------

echo "[accessory-tools] Installing COPLA..."

rm -rf "${COPLA_DIR}"

git clone \
    https://github.com/santirdnd/COPLA.git \
    "${COPLA_DIR}"

cd "${COPLA_DIR}"

conda env create \
    -f copla.environment.yml \
    -n copla

# COPLA requires this older Python/toolchain combination.
conda install -y \
    -n copla \
    -c conda-forge \
    -c bioconda \
    python=3.8.0 \
    graph-tool=2.33
    
conda install -y \
    -n copla \
    -c conda-forge \
    ruby

conda install -y \
    -n copla \
    setuptools


# ----------------------------------------------------------------------
# MacSyFinder / MacSyView
# ----------------------------------------------------------------------

echo "[accessory-tools] Installing MacSyFinder environment..."

cd "${COPLA_DIR}"

conda env create \
    -f macsyfinder.environment.yml \
    -n macsyfinder

MACSY_PREFIX="${CONDA_DIR}/envs/macsyfinder"
MACSY_SRC="${MACSY_PREFIX}/src"

mkdir -p "${MACSY_PREFIX}"
cd "${MACSY_PREFIX}"

wget -4 \
    https://github.com/gem-pasteur/macsyfinder/archive/macsyfinder-1.0.5.tar.gz

tar -xzf macsyfinder-1.0.5.tar.gz

wget -4 \
    https://github.com/gem-pasteur/macsyview/archive/macsyview-1.0.1.tar.gz

tar -xzf macsyview-1.0.1.tar.gz

mv macsyfinder-macsyfinder-1.0.5 "${MACSY_SRC}"
mv macsyview-macsyview-1.0.1 "${MACSY_SRC}/macsyview"

rm -f \
    macsyfinder-1.0.5.tar.gz \
    macsyview-1.0.1.tar.gz

cd "${MACSY_SRC}"

conda run -n macsyfinder \
    python setup.py build

conda run -n macsyfinder \
    python setup.py test -vv

conda run -n macsyfinder \
    python setup.py install \
    --prefix="${MACSY_PREFIX}"


# ----------------------------------------------------------------------
# COPLA ANI helper
# ----------------------------------------------------------------------

echo "[accessory-tools] Installing COPLA ANI helper..."

cd "${COPLA_DIR}"

wget -4 -O ani.rb \
    https://raw.githubusercontent.com/lmrodriguezr/enveomics/main/Scripts/lib/enveomics_rb/anir.rb

chmod +x ani.rb
mv ani.rb bin/


# ----------------------------------------------------------------------
# COPLA databases
# ----------------------------------------------------------------------

echo "[accessory-tools] Downloading COPLA databases..."

cd "${COPLA_DIR}"

chmod +x bin/download_Copla_databases.sh

#Copla database site currently down, this is a workaround
COPLA_DOWNLOAD_SCRIPT="${COPLA_DIR}/bin/download_Copla_databases.sh"

sed -i \
	's#wget https://castillo.dicom.unican.es/zaguan/Copla/Copla_databases_latest.tar#curl -L "https://web.archive.org/web/20220709162449if_/https://castillo.dicom.unican.es/zaguan/Copla/Copla_databases_RS84.tar" -o Copla_databases_RS84.tar#' \
	"$COPLA_DOWNLOAD_SCRIPT"

sed -i \
	's#tar -xf Copla_databases_latest.tar#tar -xf Copla_databases_RS84.tar#' \
	"$COPLA_DOWNLOAD_SCRIPT"

conda run -n copla \
    bash bin/download_Copla_databases.sh

#Checks that the download was successful
test -f "${COPLA_DIR}/databases/Copla_RS84/CoplaDB.fofn"
test -f "${COPLA_DIR}/databases/Copla_RS84/RS84f_sHSBM.pickle"

# # ----------------------------
# # Abricate setup
# # ----------------------------
conda create -n abricate-env \
	-c conda-forge \
	-c bioconda \
	-c defaults \
	abricate \
	-y 

# ----------------------------------------------------------------------
# Cleanup
# ----------------------------------------------------------------------

echo "[accessory-tools] Cleaning Conda caches..."

conda clean -afy

echo "accessory-tools Finished."