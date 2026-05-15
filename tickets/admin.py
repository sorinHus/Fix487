from django.contrib import admin
from .models import Category, Ticket, TicketComment, TicketAttachment, TimeLog


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status', 'priority', 'company', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'category']
    search_fields = ['title', 'description']
    raw_id_fields = ['created_by', 'assigned_to', 'company']


admin.site.register(Category)
admin.site.register(TicketComment)
admin.site.register(TicketAttachment)
admin.site.register(TimeLog)
