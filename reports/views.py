from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from django.utils import timezone
from datetime import timedelta

from tickets.models import Ticket
from accounts.models import User


class SummaryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = self._base_qs(user)
        today = timezone.now().date()

        by_status = (
            qs.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        by_priority = (
            qs.values('priority')
            .annotate(count=Count('id'))
            .order_by('priority')
        )
        by_category = (
            qs.exclude(category=None)
            .values(name=F('category__name'))
            .annotate(count=Count('id'))
            .order_by('-count')[:6]
        )

        open_statuses = ['new', 'assigned', 'in_progress', 'on_hold']
        resolved_today = qs.filter(
            status='resolved',
            resolved_at__date=today,
        ).count()
        last_30 = qs.filter(created_at__gte=timezone.now() - timedelta(days=30)).count()

        return Response({
            'total': qs.count(),
            'open': qs.filter(status__in=open_statuses).count(),
            'resolved_today': resolved_today,
            'sla_breaches': qs.filter(sla_breach=True).count(),
            'last_30_days': last_30,
            'by_status': list(by_status),
            'by_priority': list(by_priority),
            'by_category': list(by_category),
        })

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
