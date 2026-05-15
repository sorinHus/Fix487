from django.db import models
from django.conf import settings


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Ticket(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        ASSIGNED = 'assigned', 'Assigned'
        IN_PROGRESS = 'in_progress', 'In Progress'
        ON_HOLD = 'on_hold', 'On Hold'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    company = models.ForeignKey('accounts.Company', on_delete=models.CASCADE, related_name='tickets')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tickets')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')

    due_date = models.DateTimeField(null=True, blank=True)
    sla_breach = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'#{self.pk} {self.title}'


class TicketComment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    body = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author} on #{self.ticket_id}'


class TicketAttachment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/%Y/%m/')
    filename = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename


class TimeLog(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='timelogs')
    technician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='timelogs')
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']

    def save(self, *args, **kwargs):
        if self.started_at and self.ended_at:
            delta = self.ended_at - self.started_at
            self.duration_minutes = max(0, int(delta.total_seconds() / 60))
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Timelog by {self.technician} on #{self.ticket_id}'


class TicketActivity(models.Model):
    class Action(models.TextChoices):
        CREATED          = 'created',          'Created'
        STATUS_CHANGED   = 'status_changed',   'Status changed'
        ASSIGNED         = 'assigned',         'Assigned'
        UNASSIGNED       = 'unassigned',       'Unassigned'
        PRIORITY_CHANGED = 'priority_changed', 'Priority changed'
        COMMENT_ADDED    = 'comment_added',    'Comment added'
        RESOLVED         = 'resolved',         'Resolved'

    ticket     = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='activities')
    actor      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='activities')
    action     = models.CharField(max_length=30, choices=Action.choices)
    detail     = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} on #{self.ticket_id}'
