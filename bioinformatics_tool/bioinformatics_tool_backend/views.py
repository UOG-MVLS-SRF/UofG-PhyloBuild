import base64
import os
import shutil
import time
import binascii
import uuid
import re
from urllib.parse import unquote
from .tar_wrapper import *
from django.http import HttpResponse, JsonResponse, FileResponse
from django.utils.text import get_valid_filename
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.throttling import AnonRateThrottle
from django.core.files.base import ContentFile
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from os import listdir
from .models import PendingExecution, StoredGenome
from .tool_kits import accurate_padding, is_base64

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import PendingExecution



def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

def valid_fasta(data):
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return False

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    if not lines:
        return False

    if not lines[0].startswith(">"):
        return False

    return True

#Various server hardening measures added. We check for:
#Data tag
#File type (with additional checking that FASTA files are actually fasta)
#File size
#File encoding
#We also strip the user-supplied filename
@api_view(["POST"])
@throttle_classes([AnonRateThrottle])
def upload_files(request):

    session_id = request.data.get("id")
    data = request.data.get("data")
    tag = request.data.get("tag")

    print(repr(data[:100]), flush=True)
    
    if not session_id or not data or not tag:
        return JsonResponse(
            {"error": "Missing required upload information"},
            status=400,
        )

    if tag not in settings.ALLOWED_TAGS:
        return JsonResponse(
            {"error": "Invalid upload type"},
            status=400,
        )

    # Reject obviously oversized requests before decoding.
    # Base64 data is larger than the original file, so allow some overhead.
    if len(data) > settings.MAX_FILE_SIZE * 2:
        return JsonResponse(
            {"error": "File is too large"},
            status=413,
        )

    #Checks for utf-8 files
    try:
        decoded_data = data.encode("utf-8")
    except UnicodeEncodeError:
        return JsonResponse(
            {"error": "Invalid file data"},
            status=400,
        )

    # Check the real decoded file size.
    if len(decoded_data) > settings.MAX_FILE_SIZE:
        return JsonResponse(
            {"error": "File is too large"},
            status=413,
        )
    
    #Checks the format is allowed for the selected tag
    filename = request.data.get("name", "")
    extension = Path(filename).suffix.lower()

    if extension not in settings.ALLOWED_EXTENSIONS[tag]:
        allowed_tags = ", ".join(settings.ALLOWED_EXTENSIONS[tag])
        return JsonResponse(
            {"error": f"File type {extension} is not allowed. Please use one of: {allowed_tags}"},
            status=400,
        )

    if tag in {"reference_genome", "outgroup_genome", "genome_tree", "gene_tree", "gene_interest"}:
        if not valid_fasta(decoded_data):
            return JsonResponse(
                {"error": "Invalid FASTA file"},
                status=400,
            )
    
    temp, created = PendingExecution.objects.get_or_create(
        session_id=request.data["id"],
    )
    
    # Use a fixed filename where the application requires one.
    if tag == "reference_genes":
        filename = "geneList1.txt"
    else:
        # Removes any supplied directory path
        filename = Path(filename).name

        # Removes problematic characters
        filename = get_valid_filename(filename)

    uploaded_file = ContentFile(
        decoded_data,
        name=filename,
    )
    
    setattr(temp, tag, uploaded_file)

    temp.save(
        update_fields=[tag]
    )

    return JsonResponse(
        {"msg": f"{tag} upload successful"},
        status=200,
    )

def _sync_filefield_with_disk(session_id, file_type):
    # If the upload folder is gone or empty, clear the FileField too - otherwise it keeps
    # pointing at deleted files and the job crashes when it tries to read them.
    try:
        obj = PendingExecution.objects.get(session_id=session_id)
    except PendingExecution.DoesNotExist:
        return
    if not hasattr(obj, file_type):
        return
    dir_path = os.path.join(settings.MEDIA_ROOT, "input", str(session_id), file_type)
    if not os.path.isdir(dir_path) or not os.listdir(dir_path):
        setattr(obj, file_type, None)
        obj.save()


@api_view(["PUT"])
def delete_file(request, session_id, file_type, file_name):
    file_name = unquote(file_name).replace(' ', '_')  # Replace spaces with underscores
    path = os.path.join(settings.MEDIA_ROOT, "input", session_id, file_type, file_name)
    # Check if file exists
    if os.path.exists(path):
        try:
            os.remove(path)
            _sync_filefield_with_disk(session_id, file_type)
            return JsonResponse({"message": "File deleted successfully"})
        except Exception as e:
            # Log the error and return a response
            print(f"Error while deleting file: {e}")
            return JsonResponse({"error": "An error occurred while deleting the file"}, status=500)
    else:
        return JsonResponse({"error": "File not found"}, status=404)
        
@api_view(["PUT"])
def delete_all(request, session_id, file_type):
    path = os.path.join(settings.MEDIA_ROOT, "input", session_id, file_type)

    print("DELETE PATH:", path)
    if os.path.exists(path):
        try:
            shutil.rmtree(path)
            _sync_filefield_with_disk(session_id, file_type)
            return JsonResponse({"message": "All files deleted successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"message": "Directory already absent"}, status=200)
        
@api_view(["POST"])
def upload_email(request):
    if request.method == "POST":
        session_id=request.data["id"]
        email = request.data["email"]
        target_exec = PendingExecution.objects.get(session_id=session_id)
        target_exec.email = email
        target_exec.save()

        send_mail(
            subject="PhyloTree - Confirmation",
            message = render_to_string('bioinformatics_tool/email_confirmation_template.html', {
                            'session_id': session_id
                        }),

            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False
        )

        return JsonResponse({"msg": email+" upload success"}, status=200)
    else:
        return JsonResponse({"error":"{} went worng".format(request.data["id"])}, status=400)
    

@api_view(["POST"])
def upload_sample_sheet(request):
    if request.method == "POST":
        session_id=request.data["id"]
        data = request.data["data"]
        txt_header = "strain,name_for_plot,group,of_interest,color,"
        data = txt_header +data
        data_with_tabs = data.replace(",", "\t")
        parts = data_with_tabs.split('\t')
        data_with_newlines = '\n'.join('\t'.join(parts[i:i + 5]) for i in range(0, len(parts), 5))
        pend_exec = PendingExecution.objects.get(session_id=session_id)
        pend_exec.sample_text=data_with_newlines
        pend_exec.save()
        return JsonResponse({"msg": data+" upload success"}, status=200)
    else:
        return JsonResponse({"error":"{} went worng".format(request.data["id"])}, status=400)

@api_view(["POST"])
def upload_files_from_database(request):
    if request.method == "POST":
        files = []
        temp, created  = PendingExecution.objects.get_or_create(
            session_id=request.data["id"],
        )
        tag = request.data["tag"]
        if tag == "E Coli":
            for f in listdir("genome_database/Ecoli_Genomes/"):
                file_path = os.path.join("genome_database/Ecoli_Genomes/", f)
                with open(file_path) as fopen:
                    data = fopen.read()
                    file = ContentFile(data.encode('utf-8'), name=f)
                    setattr(temp, "genome_tree", file)
                    temp.save()
                    files.append(f)
        elif tag == "Lentivirus":
            for f in listdir("genome_database/Lentivirus_Genomes/"):
                file_path = os.path.join("genome_database/Lentivirus_Genomes/", f)
                with open(file_path) as fopen:
                    data = fopen.read()
                    file = ContentFile(data.encode('utf-8'), name=f)
                    setattr(temp, "genome_tree", file)
                    temp.save()
                    files.append(f)
        else:
            return JsonResponse({"error":"{} {} file type is not set in db".format(request.data["id"], tag)}, status=400)

        return JsonResponse({"files": files}, status=200)
    else:
        return JsonResponse({"error":"{} went worng".format(request.data["id"])}, status=400)

@api_view(["POST"])
def submit_exec(request):
    if request.method == "POST":

        print("SUBMIT SESSION:", request.data.get("id"), flush=True)
        print("SUBMIT GENOME IDS:", request.data.get("database_genomes"), flush=True)
        print("SUBMIT REF GENOME IDS:", request.data.get("database_ref_genome"), flush=True)
        print("SUBMIT OUTGROUP GENOME IDS:", request.data.get("database_outgroup_genome"), flush=True)
        print("SUBMIT DISPLAY NAMES:", request.data.get("display_names"), flush=True)

        virulence = str(
            request.data.get("virulence", "")
        ).lower() in ("1", "true", "yes", "on")

        plasmids = str(
            request.data.get("plasmids", "")
        ).lower() in ("1", "true", "yes", "on")

        job_type = str(
            request.data.get("run_type", "")
        ).lower()

        display_names = request.data.get(
            "display_names",
            {}
        )

        species = request.data.get("species", "")
        genome_ids = request.data.get("database_genomes", [])
        ref_genome_ids = request.data.get("database_ref_genome", [])
        outgroup_genome_ids = request.data.get("database_outgroup_genome", [])

        genomes = StoredGenome.objects.filter(id__in=genome_ids)
        ref_genomes = StoredGenome.objects.filter(id__in=ref_genome_ids)
        outgroup_genomes = StoredGenome.objects.filter(id__in=outgroup_genome_ids)

        # Set the role used by files_passer
        genomes.update(tag=None)

        ref_genomes.update(
            tag="ohrbid_ref_genome"
        )

        outgroup_genomes.update(
            tag="ohrbid_outgroup_genome"
        )

        # All selected preloaded genomes belong to the execution M2M
        all_genomes = StoredGenome.objects.filter(
            id__in=(
                list(genome_ids) +
                list(ref_genome_ids) +
                list(outgroup_genome_ids)
            )
        )

        try:
            session = request.data["id"]

            target_exec = PendingExecution.objects.get(
                session_id=session
            )

            target_exec.status = (
                PendingExecution.StatusInLine.PEND
            )

            target_exec.run_virulence = virulence
            target_exec.run_plasmids = plasmids
            target_exec.job_type = job_type
            target_exec.display_names = display_names
            target_exec.species = species

            target_exec.database_genomes.set(
                all_genomes
            )

            print(
                "SAVED DATABASE GENOMES:",
                list(
                    target_exec.database_genomes.values(
                        "id",
                        "name",
                        "file_path",
                        "tag"
                    )
                ),
                flush=True
            )

            target_exec.save()

            return JsonResponse(
                {"msg": " update success"},
                status=200
            )

        except PendingExecution.DoesNotExist:

            time.sleep(5)

            target_exec = PendingExecution.objects.get(
                session_id=session
            )

            target_exec.status = (
                PendingExecution.StatusInLine.PEND
            )

            target_exec.run_virulence = virulence
            target_exec.job_type = job_type
            target_exec.display_names = display_names

            target_exec.database_genomes.set(
                all_genomes
            )

            print(
                "SAVED DATABASE GENOMES:",
                list(
                    target_exec.database_genomes.values(
                        "id",
                        "name",
                        "file_path",
                        "tag"
                    )
                ),
                flush=True
            )

            target_exec.save()

            return JsonResponse(
                {"msg": " update success"},
                status=200
            )

        except Exception as e:
            return JsonResponse(
                {
                    "msg": (
                        f"Update fail due to: {str(e)}"
                    )
                },
                status=400
            )
            
def _offset_pattern(stream, value):
    # match geom_tiplab calls - offset= may be a number or the lab_offset variable, so match either
    pattern = r'(geom_tiplab\(size=3, aes\((?:colour=group, )?label=label2\), offset=)[^)]+(\))'

    # keep the rest of the call, swap in the new offset value
    new_stream = re.sub(pattern, lambda m: f"{m.group(1)}{value}{m.group(2)}", stream)

    return new_stream



@api_view(["POST"])
@csrf_exempt
def offset_tune(request):
    if request.method == "POST":
        try:
            session = request.data["id"]
            offset = request.data["offset"]
            target_exec = PendingExecution.objects.get(session_id=session)
            rscript_path = target_exec.data_tree.path  # Assuming data_tree is a FileField
            rscript_dir = os.path.dirname(rscript_path)
            rscript_path = os.path.join(rscript_dir, "newRscript.r")

            # Read the file, replace the offset value, and write it back
            with open(rscript_path, 'r') as file:
                content = file.read()

            new_content=_offset_pattern(content, offset)

            # Write the new content back to the file
            with open(rscript_path, 'w') as file:
                file.write(new_content)

            return JsonResponse({"msg": "Update Success"}, status=200)
        except Exception as e:
            print(str(e))
            return JsonResponse({"msg": f"Update fail due to: {str(e)}"}, status=400)


@api_view(["GET"])
def download_results(request, session_id):
    """Return a job's results (by session id) as a zip download.

    200 + application/zip : results are ready
    202 {"status":"processing"} : job exists but hasn't finished yet
    404 {"status":"not_found"} : no results and no pending job for that id
    """
    output_dir = os.path.join(settings.MEDIA_ROOT, "output", str(session_id))
    if os.path.isdir(output_dir) and os.listdir(output_dir):
        from .email_service import zipfile_preparation
        zip_bytes = zipfile_preparation(output_dir)
        response = HttpResponse(zip_bytes, content_type="application/zip")
        response["Content-Disposition"] = f'attachment; filename="phylobuild_results_{session_id}.zip"'
        return response

    if PendingExecution.objects.filter(session_id=session_id).exists():
        return JsonResponse({"status": "processing"}, status=202)

    return JsonResponse({"status": "not_found"}, status=404)


@api_view(["GET"])
def results_status(request, session_id):
    """Job status plus the result files available for inline display in the results page.

    200 {"status":"ready","images":[...],"tables":[...]} : output files exist
        images = PNGs (tree / carriage heatmap); tables = TSVs (AMR / virulence summaries + matrices)
    202 {"status":"processing"} : job exists but hasn't finished yet
    404 {"status":"not_found"}  : no results and no pending job for that id
    """
    output_dir = os.path.join(settings.MEDIA_ROOT, "output", str(session_id))
    if os.path.isdir(output_dir) and os.listdir(output_dir):
        entries = os.listdir(output_dir)
        images = sorted(f for f in entries if f.lower().endswith(".png"))
        tables = sorted(f for f in entries if f.lower().endswith(".tsv"))
        trees = sorted(f for f in entries if f.lower().endswith(".nwk"))

        tree = trees[0] if trees else None

        return JsonResponse({"status": "ready", "images": images, "tables": tables, "tree":tree})

    if PendingExecution.objects.filter(session_id=session_id).exists():
        return JsonResponse({"status": "processing"}, status=202)

    return JsonResponse({"status": "not_found"}, status=404)

@api_view(["GET"])
def result_file(request, session_id, filename):
    """Serve a single result file (PNG image or TSV table) for the results page. Works in
    production (unlike the DEBUG-only media static serving) and blocks path traversal."""
    filename = os.path.basename(filename)  # never trust the path segment
    ext = os.path.splitext(filename)[1].lower()
    if ext not in settings.RESULT_CONTENT_TYPES:
        return JsonResponse({"error": "unsupported file type"}, status=400)
    path = os.path.join(settings.MEDIA_ROOT, "output", str(session_id), filename)
    if not os.path.isfile(path):
        return JsonResponse({"error": "not found"}, status=404)
    return FileResponse(open(path, "rb"), content_type=settings.RESULT_CONTENT_TYPES[ext])


@api_view(["GET"])
def database_genomes(request):
	genomes = StoredGenome.objects.all().values(
		"id",
		"name",
		"accession",
		"file_path",
	)

	return JsonResponse(
		{
			"genomes": list(genomes)
		},
		status=200
	)