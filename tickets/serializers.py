from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Ticket, Category, TicketComment, TimeLog, Notification

SLA_RESOLUTION_MAP = {
    'critical': 'sla_resolution_critical',
    'high':     'sla_resolution_high',
    'medium':   'sla_resolution_medium',
    'low':      'sla_resolution_low',
}


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class TicketListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    sla_remaining_hours = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'status', 'priority',
            'category_name', 'company_name',
            'assigned_to_name', 'created_by_name',
            'sla_breach', 'due_date', 'sla_remaining_hours',
            'created_at', 'updated_at',
        ]

    def get_sla_remaining_hours(self, obj):
        if not obj.due_date or obj.status in ('resolved', 'closed'):
            return None
        delta = obj.due_date - timezone.now()
        return round(delta.total_seconds() / 3600, 1)

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return None
        name = f'{obj.assigned_to.first_name} {obj.assigned_to.last_name}'.strip()
        return name or obj.assigned_to.username

    def get_created_by_name(self, obj):
        name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
        return name or obj.created_by.username


class TicketDetailSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return None
        name = f'{obj.assigned_to.first_name} {obj.assigned_to.last_name}'.strip()
        return name or obj.assigned_to.username

    def get_created_by_name(self, obj):
        name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
        return name or obj.created_by.username


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['title', 'description', 'priority', 'category', 'company']

    def validate(self, data):
        user = self.context['request'].user
        if user.role == 'client':
            if not user.company:
                raise serializers.ValidationError('Your account is not linked to a company.')
            data['company'] = user.company
        elif 'company' not in data:
            raise serializers.ValidationError({'company': 'This field is required.'})
        return data

    def create(self, validated_data):
        from . import activity as act
        validated_data['created_by'] = self.context['request'].user
        company = validated_data.get('company')
        priority = validated_data.get('priority', 'medium')
        if company and not validated_data.get('due_date'):
            hours = getattr(company, SLA_RESOLUTION_MAP.get(priority, 'sla_resolution_medium'), 72)
            validated_data['due_date'] = timezone.now() + timedelta(hours=hours)
        ticket = super().create(validated_data)
        act.log_created(ticket, ticket.created_by)
        return ticket


class TicketActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        from .models import TicketActivity
        model = TicketActivity
        fields = ['id', 'action', 'detail', 'actor_name', 'created_at']

    def get_actor_name(self, obj):
        if not obj.actor:
            return 'System'
        name = f'{obj.actor.first_name} {obj.actor.last_name}'.strip()
        return name or obj.actor.username


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketComment
        fields = ['id', 'body', 'is_internal', 'author_name', 'created_at']
        read_only_fields = ['author_name', 'created_at']

    def get_author_name(self, obj):
        name = f'{obj.author.first_name} {obj.author.last_name}'.strip()
        return name or obj.author.username

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['ticket_id'] = self.context['ticket_id']
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'body', 'ticket_id', 'is_read', 'created_at']


class TimeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeLog
        fields = ['id', 'started_at', 'ended_at', 'duration_minutes', 'notes']

    def create(self, validated_data):
        validated_data['technician'] = self.context['request'].user
        validated_data['ticket_id'] = self.context['ticket_id']
        return super().create(validated_data)
