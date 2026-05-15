import django_filters
from .models import Ticket

OPEN_STATUSES = ['new', 'assigned', 'in_progress', 'on_hold']


class TicketFilter(django_filters.FilterSet):
    is_open = django_filters.BooleanFilter(method='filter_open')
    unassigned = django_filters.BooleanFilter(method='filter_unassigned')

    class Meta:
        model = Ticket
        fields = ['status', 'priority', 'category', 'sla_breach']

    def filter_open(self, qs, name, value):
        if value:
            return qs.filter(status__in=OPEN_STATUSES)
        return qs

    def filter_unassigned(self, qs, name, value):
        if value:
            return qs.filter(assigned_to__isnull=True)
        return qs
