from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, F
from django.utils import timezone
from datetime import timedelta

from tickets.models import Ticket
from accounts.models import User, Company
from knowledge.models import KBArticle


class SummaryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = self._base_qs(user)
        today = timezone.now().date()
        open_statuses = ['new', 'assigned', 'in_progress', 'on_hold']

        by_status = list(qs.values('status').annotate(count=Count('id')).order_by('status'))
        by_priority = list(qs.values('priority').annotate(count=Count('id')).order_by('priority'))
        by_category = list(
            qs.exclude(category=None)
            .values(name=F('category__name'))
            .annotate(count=Count('id'))
            .order_by('-count')[:6]
        )

        data = {
            'total': qs.count(),
            'open': qs.filter(status__in=open_statuses).count(),
            'unassigned': qs.filter(status='new', assigned_to=None).count(),
            'resolved_today': qs.filter(status='resolved', resolved_at__date=today).count(),
            'sla_breaches': qs.filter(sla_breach=True).count(),
            'last_30_days': qs.filter(created_at__gte=timezone.now() - timedelta(days=30)).count(),
            'by_status': by_status,
            'by_priority': by_priority,
            'by_category': by_category,
        }

        # Admin-only global counters
        if user.role in ('admin', 'dispatcher'):
            data['active_technicians'] = User.objects.filter(role='technician', is_active=True).count()
        if user.role == 'admin':
            data['companies'] = Company.objects.filter(is_active=True).count()
            data['kb_articles'] = KBArticle.objects.filter(is_published=True).count()

        return Response(data)

    def _base_qs(self, user):
        qs = Ticket.objects.all()
        if user.role == 'technician':
            qs = qs.filter(assigned_to=user)
        elif user.role == 'client':
            qs = qs.filter(company=user.company)
        return qs


class TechnicianReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ('admin', 'dispatcher'):
            return Response({'detail': 'Forbidden.'}, status=403)

        technicians = User.objects.filter(role='technician', is_active=True)
        data = []
        for tech in technicians:
            tickets = Ticket.objects.filter(assigned_to=tech)
            name = f'{tech.first_name} {tech.last_name}'.strip() or tech.username
            data.append({
                'id': tech.id,
                'name': name,
                'assigned': tickets.count(),
                'open': tickets.filter(status__in=['assigned', 'in_progress', 'on_hold']).count(),
                'resolved': tickets.filter(status__in=['resolved', 'closed']).count(),
                'critical': tickets.filter(priority='critical').count(),
            })

        data.sort(key=lambda x: x['resolved'], reverse=True)
        return Response(data)
