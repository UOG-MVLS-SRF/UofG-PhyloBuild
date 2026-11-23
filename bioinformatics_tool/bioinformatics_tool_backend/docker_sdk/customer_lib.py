import io
import os.path
import shutil
import tarfile
import time

import docker
import docker.errors
from django.conf import settings
from docker.models.containers import Container


def get_all_containers():
    client = docker.from_env()
    containers_list = client.containers.list(all=True)
    return containers_list
def find_container(l : list , target: str)-> Container:
    # A previous job's refresh_pipeline() stop/remove/recreate can leave a stopped
    # container with the same name still listed alongside the new running one. Exec-ing
    # into the stopped one throws 409 "container is not running" and silently skips the
    # step. Always prefer a RUNNING match; only fall back to a stopped one if none run.
    matches = [container for container in l if container.name == target]
    running = [c for c in matches if getattr(c, "status", None) == "running"]
    candidates = running or matches
    return candidates[0]

def run_for_exec(command:str, target_container:str)->tuple:
    # Retry briefly: right after refresh_pipeline() recreates custom_lib there is a short
    # window where the container is still starting, during which exec_run raises a 409.
    last_err = None
    for attempt in range(10):
        container = find_container(get_all_containers(), target_container)
        try:
            exit_code, output = container.exec_run(command)
            return exit_code, output
        except docker.errors.APIError as e:
            last_err = e
            time.sleep(3)
    raise last_err


def extract_tar_to_dir(tar_path, dir_path):
    # Make sure the directory exists
    base_root=os.path.dirname(tar_path)
    with tarfile.open(tar_path, 'r') as tar:
        tar.extractall(path=base_root)
    mid_dir=os.path.join(base_root,"output")
    os.rename(mid_dir, dir_path)
    os.remove(tar_path)


def get_result_files(session_id:int, target_container):
    output_root=os.path.join("output")
    target_con_path=os.path.join("app",output_root)
    bits, stat = target_container.get_archive(target_con_path)
    session_root=os.path.join(settings.MEDIA_ROOT, output_root)
    session_dir=os.path.join(session_root, str(session_id))
    tar_path=os.path.join(session_root, "output.tar")
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir)
    if not os.path.exists(session_root):
        os.makedirs(session_root)

    with open(tar_path, 'wb') as f:
        for chunk in bits:
            f.write(chunk)
    extract_tar_to_dir(tar_path, session_dir)




if __name__ == '__main__':

    exit_code, output=run_for_exec("ls", "custom_lib")
    print(exit_code, output.decode('utf-8'))
    # get_result_files(("/path/to/fileA","/path/to/fileB"),"custom_lib")

























#class DockerContainer:
#    # todo: still need pull, push and seperating the get_file from only extracting files,
#    #  and need check if dir exist for destination dir
#
#    def __init__(self):
#        self.client=docker.from_env()
#        self.focus_container=None
#
#    def set_container(self, service_name:str)->bool:
#        #provide container name in docker compose
#        random_container_name=self.client.containers.list()[0].name[1:]
#        system_name=random_container_name.split('-')[0]
#        service_name_format=f"{system_name}-{service_name}-1"
#        self.focus_container=self.client.containers.get(service_name_format)
#        return True if self.focus_container.name==name else False
#
#    #TODO: need to decide how to raise error
#    def run_command(self, cmm_list:str):
#        exit_code, response=self.focus_container.exec_run(cmm_list)
#        return exit_code, response
#
#
#    #TODO: decide destination_path
#    def get_file(self, file_path:str):
#        destination_path="for not empty"
#        bits, stat = self.focus_container.get_archive(file_path)
#        file_data = b"".join([chunk for chunk in bits])
#        tar = tarfile.open(fileobj=io.BytesIO(file_data))
#        tar.extractall(path=destination_path)
#        #this extract all files into current dir
#
#


#to gurantee memory issue
#with MyObject() as obj:
#    obj.some_method()
# Perform operations using the object within the 'with' block
#this need enter and exit methods being implemented
#or don't forget del the obj
