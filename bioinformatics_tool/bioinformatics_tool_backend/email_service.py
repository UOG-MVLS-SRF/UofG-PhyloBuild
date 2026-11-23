import io
import mimetypes
import os
import zipfile
from django.core.mail import EmailMessage, send_mail, get_connection
from django.conf import settings
from .models import FinishedExecution, PendingExecution
from django.template.loader import render_to_string
import django
import traceback

def create_message_obj(finished_exec:FinishedExecution):

    body_message = render_to_string('bioinformatics_tool/email_result.html', {
        'session_id': finished_exec.session_id,
        'host_email': settings.DEFAULT_FROM_EMAIL
    })

    email = EmailMessage(
        subject=f'Execution {finished_exec.session_id} Done',
        body=body_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[finished_exec.email, ],  # Split by space to get list of emails
    )
    return email


def zipfile_preparation(result_path):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as zf:
        for root, dirs, files in os.walk(result_path):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, result_path)  # Get relative path to put in zip
                zf.write(file_path, arcname)
    buffer.seek(0)  # Reset file pointer to beginning
    return buffer.getvalue()

# Only attach these file types. We don't zip the results because some mail servers
# (e.g. gla.ac.uk) reject .zip attachments.
ATTACHABLE_EXTENSIONS = (".pdf", ".txt", ".csv", ".png", ".tsv",'.fasta', '.nwk')

def load_attachments(directory_path):
    filenames = [
        os.path.join(directory_path, file)
        for file in os.listdir(directory_path)
        if file.lower().endswith(ATTACHABLE_EXTENSIONS)
    ]
    attachments = []  # start with an empty list

    for filename in filenames:
        # Open in binary mode: result files include PDFs, so reading them as text
        # ('r') raises UnicodeDecodeError ("'utf-8' codec can't decode byte ...") and
        # the whole email send fails silently.
        with open(filename, 'rb') as file:
            content = file.read()
            attachment_name = os.path.basename(filename)
            mime_type, _ = mimetypes.guess_type(filename)
            if mime_type is None:
                mime_type = "application/octet-stream"  # use a default MIME type if guessing fails
            attachment = (attachment_name, content, mime_type)
            attachments.append(attachment)

    return attachments


def sending_execution(finished_exec: FinishedExecution):
    try:
        connection = get_connection()
        
        connection.open()

        email=create_message_obj(finished_exec=finished_exec)
        target_path=finished_exec.output_dir
        email.content_subtype = "html"
        # attach each result file on its own (see note on ATTACHABLE_EXTENSIONS above)
        for attachment in load_attachments(target_path):
            email.attach(*attachment)

        email.connection = connection
        email.send()
        print("email sent")
    except Exception as e:
        print("email error")
        print(e)
        traceback.print_exc()
    finally:
        if 'connection' in locals() and connection:
            connection.close()


def sending_false_inform(pending_exec):
    subject = "Execution Cannot Be Completed"
    message = ("Server cannot finish execution within a day due to too large a process or internal error. "
               "Please make sure uploaded files are correct and retry. Or contact support@example.com. "
               "We would like to hear back from you and improve the server.")
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [pending_exec.email]

    send_mail(subject, message, email_from, recipient_list, fail_silently=False)
