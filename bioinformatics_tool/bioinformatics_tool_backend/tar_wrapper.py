import io
import os.path
import tarfile
import re

from django.conf import settings

from .models import PendingExecution
from django.db import models
from typing import Any
from pathlib import Path

#todo: can change this file into class

#check if fields are not empty
def are_filefields(instance:PendingExecution)->list:
    filefields = [field for field in instance._meta.fields if (isinstance(field, models.FileField) and getattr(instance, field.name))]
    return filefields

def get_actions_list(obj)->tuple[str,list[Any]]:
    filefields=are_filefields(obj)

    obj_path=os.path.join(settings.MEDIA_ROOT, obj.file_path, str(obj.session_id), )
    return obj_path, filefields

def get_files_in_dir(file_path:str):
    #note: file_path format is /app/media/input/1693042680417/genome_tree
    entries = os.listdir(file_path)
    for file in entries:
        file=os.path.join(file_path,file)
    return entries

def string_to_tar_stream(s: str, file_name: str) -> io.BytesIO:
    """Convert a string to a tar stream with the provided file name."""
    tar_stream = io.BytesIO()
    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        encoded = s.encode('utf-8')
        tarinfo = tarfile.TarInfo(name=file_name)
        tarinfo.size = len(encoded)
        tar.addfile(tarinfo, io.BytesIO(encoded))
    tar_stream.seek(0)
    return tar_stream

#Sends user uploaded files to the customer_lib container
def extract_to_tarstream(obj_path, dir_name, display_names=None):
    #obj_path format app/media/input/1693042680417/
    display_names = display_names or {}
    
    target_dir=os.path.join(obj_path, dir_name)
    target_files=get_files_in_dir(target_dir)
    #this can cause the stack overflow in the future

    # Create an in-memory tar stream
    tar_stream = io.BytesIO()

    # Open the tar stream in write mode
    with tarfile.open(fileobj=tar_stream, mode='w') as tar:
        for file in target_files:
            file_full_path=os.path.join(target_dir,file)
            custom_name = display_names.get(file)

            if custom_name:
                _, extension = os.path.splitext(file)
                arc_name = arc_name = safe_filename(custom_name) + extension
            else:
                arc_name = file

            tar.add(file_full_path,arcname=arc_name)

    # Move the stream's position back to the beginning for reading
    tar_stream.seek(0)
    tar_stream_content = tar_stream.read()

    # Read the content of the tar stream as bytes
    return tar_stream_content

#Specifies where files should go in the customer lib container
def all_folder_path_decider(field):
    fields_path_transfer={"genome_tree":"Tree_Genomes","gene_tree":"Tree_Genes","gene_interest":"Genomes_Interest",
                          "carriage_gene":"Carriage_Genes", "reference_genes":"PhyloGenes",
                          "":""}

    return os.path.join("/app",fields_path_transfer[field.name])

#Sends pre-loaded genomes to the customer lib container
def file_to_tar_stream(file_path, target_name=None):
	file_path = Path(file_path)

	if target_name is None:
		target_name = file_path.name

	tar_stream = io.BytesIO()

	with tarfile.open(fileobj=tar_stream, mode="w") as tar:
		tar.add(
			file_path,
			arcname=target_name
		)

	tar_stream.seek(0)

	return tar_stream

#Sanitises user-input names
def safe_filename(name):
	name = name.strip()
	name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)

	return name

def check_source_path(genome):
    source_path = Path("/genome_library") / genome.file_path

    if not source_path.is_file():
        print(
            f"files_passer: skipping database genome {genome.name} - file not found at {source_path}"
        )

    return source_path

def send_preloaded(source_path, display_name, tgt_path, target_con):
    target_name = safe_filename(display_name) + source_path.suffix

    tar_stream = file_to_tar_stream(source_path, target_name)

    print(
        f"COPYING PRELOADED GENOME: "
        f"{source_path} -> {tgt_path}/{target_name}"
    )
    
    target_con.put_archive(data=tar_stream,path=tgt_path)

def files_passer(target_con, target_obj):
    obj_path, filefields = get_actions_list(target_obj)
    txt_stream = target_obj.sample_text

    display_names = target_obj.display_names or {}
    usr_names = display_names.get("database_genomes",{})

    for field in filefields:
        # skip fields whose files are no longer on disk (e.g. after "Clear All") so the
        # whole job doesn't fail on a missing directory
        field_dir = os.path.join(obj_path, field.name)
        if not os.path.isdir(field_dir) or not os.listdir(field_dir):
            print("files_passer: skipping '%s' - no files on disk at %s" % (field.name, field_dir))
            continue
        if field.name == "data_tree":
            tar_stream = extract_to_tarstream(obj_path, field.name)
            # This command creates a new directory at "/path/to/new_directory" inside the container
            _ = target_con.exec_run("mkdir -p /app/output")
            target_con.put_archive(data=tar_stream, path="/app/output")
            break
        tar_stream = extract_to_tarstream(obj_path, field.name, display_names.get(field.name, {}))
        target_con.put_archive(data=tar_stream, path=all_folder_path_decider(field=field))

    print(
        "PRELOADED GENOMES FOR RUN:",
        list(
            target_obj.database_genomes.values(
                "id",
                "name",
                "file_path"
            )
        )
    )
    
    for genome in target_obj.database_genomes.all():

        source_path = check_source_path(genome)

        #No tag = add to Tree_Genomes
        if genome.tag == None:
            
            display_name = usr_names.get(
                str(genome.id),
                genome.name
            )

            send_preloaded(source_path, display_name, "/app/Tree_Genomes", target_con)

    if txt_stream:
        txt_tar_stream = string_to_tar_stream(txt_stream, "sample_sheet.txt")
        target_con.put_archive(data=txt_tar_stream, path="/app/output")


if __name__=="__main__":
    get_actions_list(11)
