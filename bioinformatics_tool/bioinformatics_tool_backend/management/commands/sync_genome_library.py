import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from bioinformatics_tool_backend.models import StoredGenome


GENOME_LIBRARY_ROOT = Path("/genome_library")
METADATA_FILE = GENOME_LIBRARY_ROOT / "metadata.csv"


class Command(BaseCommand):
	help = "Synchronise genome_library metadata with StoredGenome"

	def handle(self, *args, **options):
		if not METADATA_FILE.is_file():
			self.stdout.write(
				self.style.ERROR(
					f"Metadata file not found: {METADATA_FILE}"
				)
			)
			return

		seen_accessions = set()

		with open(METADATA_FILE, newline="", encoding="utf-8") as csvfile:
			reader = csv.DictReader(csvfile)

			for row in reader:
				file_name = row["file_name"].strip()
				accession = row["accession"].strip()

				file_path = GENOME_LIBRARY_ROOT / file_name

				if not file_path.is_file():
					self.stdout.write(
						self.style.WARNING(
							f"Skipping {accession}: file not found: {file_name}"
						)
					)
					continue

				genome, created = StoredGenome.objects.update_or_create(
					accession=accession,
					defaults={
						"name": row["name"].strip(),
						"file_path": file_name,
					}
				)

				seen_accessions.add(accession)

				if created:
					self.stdout.write(
						self.style.SUCCESS(
							f"Added: {accession}"
						)
					)
				else:
					self.stdout.write(
						f"Updated: {accession}"
					)

		self.stdout.write(
			self.style.SUCCESS(
				f"Genome library sync complete: {len(seen_accessions)} genomes processed"
			)
		)