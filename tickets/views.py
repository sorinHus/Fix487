from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ticket, Category, TicketActivity
from .serializers import (
    TicketListSerializer, TicketDetailSerializer,
    TicketCreateSerializer, CategorySerializer,
    TicketCommentSerializer, TimeLogSerializer,
    TicketActivitySerializer,
)
from .filters import TicketFilter
from . import activity as act


class CategoryListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)


class TicketListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TicketFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TicketCreateSerializer
        return TicketListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.select_related('company', 'assigned_to', 'created_by', 'category')
        if user.role in ('admin', 'dispatcher'):
            return qs
        if user.role == 'technician':
            return qs.filter(assigned_to=user)
        if user.role == 'client':
            return qs.filter(company=user.company)
        return qs.none()


class TicketDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketDetailSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.select_related('company', 'assigned_to', 'created_by', 'category')
        if user.role in ('admin', 'dispatcher'):
            return qs
        if user.role == 'technician':
            return qs.filter(assigned_to=user)
        if user.role == 'client':
            return qs.filter(company=user.company)
        return qs.none()

    def perform_update(self, serializer):
        ticket = self.get_object()
        old_data = {
            'status': ticket.status,
            'assigned_to_id': ticket.assigned_to_id,
            'priority': ticket.priority,
        }
        instance = serializer.save()
        instance.refresh_from_db(fields=['assigned_to'])
        act.log_changes(instance, self.request.user, old_data)


class TicketActivityListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketActivitySerializer

    def get_queryset(self):
        return TicketActivity.objects.filter(
            ticket_id=self.kwargs['pk']
        ).select_related('actor').order_by('created_at')


class TicketCommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketCommentSerializer

    def get_queryset(self):
        qs = Ticket.objects.get(pk=self.kwargs['pk']).comments.select_related('author')
        user = self.request.user
        if user.role == 'client':
            qs = qs.filter(is_internal=False)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['ticket_id'] = self.kwargs['pk']
        return ctx

    def perform_create(self, serializer):
        instance = serializer.save()
        act.log_comment(instance.ticket, self.request.user)


class TimeLogListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TimeLogSerializer

    def get_queryset(self):
        return Ticket.objects.get(pk=self.kwargs['pk']).timelogs.select_related('technician')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['ticket_id'] = self.kwargs['pk']
        return ctx
