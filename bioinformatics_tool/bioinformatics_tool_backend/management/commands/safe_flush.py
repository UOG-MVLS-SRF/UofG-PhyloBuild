import os
import shutil

from django.core.management.base import BaseCommand, CommandError
from ...models import PendingExecution
from django.conf import settings

class Command(BaseCommand):
    help = 'Greets a user by name, optionally repeating the greeting'
    media_root=os.path.join(settings.MEDIA_ROOT, "input")

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument('mode', type=str, default="all", help='Two modes. Default mode clears all pending executions ("all") '
                                                                  'or clear a specific pending executions using an --id tag ("single").')

        parser.add_argument('--session_id', '-r', type=int, help='The id to delete')

    def handle(self, *args, **options):
        mode = options['mode']
        session_id = options['session_id']

        if mode == "all":
            PendingExecution.objects.all().delete()
            shutil.rmtree(self.media_root)
            self.stdout.write(self.style.SUCCESS('All pending executions have been deleted.'))
        else:
            if session_id is None:
                raise CommandError('You must provide an --id tag when using "single" mode.')
            try:
                target = PendingExecution.objects.get(session_id=session_id)
                target.delete()
                self.stdout.write(self.style.SUCCESS(f'Pending execution with id {session_id} has been deleted.'))
            except PendingExecution.DoesNotExist:
                raise CommandError(f'No pending execution found with id {session_id}.')

