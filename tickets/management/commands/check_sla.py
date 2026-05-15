from django.core.management.base import BaseCommand
from django.utils import timezone
from tickets.models import Ticket


class Command(BaseCommand):
    help = 'Flag tickets that have breached their SLA due date'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        breached = Ticket.objects.filter(
            due_date__lt=now,
            sla_breach=False,
        ).exclude(status__in=['resolved', 'closed'])

        count = breached.update(sla_breach=True)
        self.stdout.write(f'Flagged {count} ticket(s) as SLA breach.')
