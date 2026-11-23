from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("upload_files/", views.upload_files, name="upload_files"),
    path("upload_email/", views.upload_email, name="upload_email"),
    path("upload_sample_sheet/", views.upload_sample_sheet, name="upload_sample_sheet"),
    path("upload_genome_database/", views.upload_files_from_database, name="upload_files_from_database"),
    path("submit_exec/", views.submit_exec, name = "submit_exec"),
    path("delete_file/<str:session_id>/<str:file_type>/<str:file_name>/", views.delete_file, name="delete_file"),
    path("delete_all/<str:session_id>/<str:file_type>/", views.delete_all, name="delete_file"),
    path("offset_tune/", views.offset_tune, name="offset_tune"),
    path("download_results/<str:session_id>/", views.download_results, name="download_results"),
    path("results_status/<str:session_id>/", views.results_status, name="results_status"),
    path("result_file/<str:session_id>/<str:filename>/", views.result_file, name="result_file"),
    path("genome_library/", views.database_genomes)
]