import os
import docker
from django.conf import settings
from django.db import models
from django.core.management.base import BaseCommand, CommandError
from ...docker_sdk import customer_lib as cl
from ...docker_sdk import refresh_container as rc
from ... import tar_wrapper as tw
from ... import email_service as es
from ...models import PendingExecution, FinishedExecution
from ...command_center import detector
from ..timeout_function.time_counter import time_limit, time_tamplate, TimeoutException
from ...email_service import sending_false_inform
def get_oldest_pending():
    pending  = PendingExecution.objects.filter(status="PE").earliest("id")
    pending.status=PendingExecution.StatusInLine.RUN
    return pending

def set_obj_attrs(obj, **kwargs):
    for key, value in kwargs:
        setattr(obj, key, value)
    obj.save()

def copy_obj_fields(source_obj, target_obj):
    for field in source_obj._meta.fields:
        field_name = field.name
        if hasattr(target_obj, field_name) and not isinstance(field, models.FileField):
            setattr(target_obj, field_name, getattr(source_obj, field_name))
        setattr(target_obj, "file_path", "output")
    return target_obj

def create_finish_exec(target_obj: PendingExecution):
    f = FinishedExecution()
    # Copy fields from target_obj to f
    f = copy_obj_fields(target_obj, f)
    f.output_dir = os.path.join(settings.MEDIA_ROOT, f.file_path, str(f.session_id))
    f.save()
    es.sending_execution(f)
    target_obj.delete()

def run_analysis(target_obj: PendingExecution):
    hour=time_tamplate("hour")
    try: # give AMR/virulence jobs room to finish (AMRFinderPlus is slow) - up to 4 hours
        with time_limit(4*hour):

            target_container = os.environ["CUSTOM_LIB_CONTAINER"]
            target_con = cl.find_container(cl.get_all_containers(), target_container)

            tw.files_passer(target_con=target_con, target_obj=target_obj)# handling files transfer from local to container

            tasks=detector.commands_generator(target_obj)
            for i in tasks:
                print("we start" + i)
                exit_code, output = cl.run_for_exec(command=i, target_container=target_container)
                print("here is output "+output.decode('utf-8'))
            #get results from container
            try:
                cl.get_result_files(target_obj.session_id, target_con)
            except Exception as e:
                print(f"An error occurred: {e}")

            create_finish_exec(target_obj=target_obj)
    except Exception as e:
        # catch the timeout and any other failure so the job doesn't get stuck without a
        # status update or email
        print(f"run_analysis failed for {target_obj.session_id}: {type(e).__name__}: {e}")
        target_obj.status=target_obj.StatusInLine.ERR
        target_obj.save()
        sending_false_inform(target_obj)

class Command(BaseCommand):
    help = 'Find oldest obj in pending and run analysis ^^'

    def handle(self, *args, **kwargs):
        try:
            target = get_oldest_pending()
            if target:
                target.status=target.StatusInLine.RUN
                target.save()
                target.refresh_from_db()
                run_analysis(target)
                try:
                    rc.refresh_pipeline()
                except docker.errors.APIError as e:
                    print(f"API error occurred: {e}")
                except Exception as e:
                    print(f"An unexpected error occurred: {e}")

            print("Command Complete with no error!")
        except Exception as Argument:
            print(Argument)
        return