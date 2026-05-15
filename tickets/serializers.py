from rest_framework import serializers
from .models import Ticket, Category, TicketComment, TimeLog


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class TicketListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'status', 'priority',
            'category_name', 'company_name',
            'assigned_to_name', 'created_by_name',
            'sla_breach', 'created_at', 'updated_at',
        ]

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
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


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


class TimeLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeLog
        fields = ['id', 'started_at', 'ended_at', 'duration_minutes', 'notes']

    def create(self, validated_data):
        validated_data['technician'] = self.context['request'].user
        validated_data['ticket_id'] = self.context['ticket_id']
        return super().create(validated_data)
