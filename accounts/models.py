from django.contrib.auth.models import AbstractUser
from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    sla_response_critical = models.PositiveIntegerField(default=1)
    sla_response_high = models.PositiveIntegerField(default=4)
    sla_response_medium = models.PositiveIntegerField(default=8)
    sla_response_low = models.PositiveIntegerField(default=24)
    sla_resolution_critical = models.PositiveIntegerField(default=4)
    sla_resolution_high = models.PositiveIntegerField(default=24)
    sla_resolution_medium = models.PositiveIntegerField(default=72)
    sla_resolution_low = models.PositiveIntegerField(default=168)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Companies'
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('dispatcher', 'Dispatcher'),
        ('technician', 'Technician'),
        ('client', 'Client'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    company = models.ForeignKey(
        Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='users'
    )
    phone = models.CharField(max_length=50, blank=True)
    position = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        ordering = ['username']

    def __str__(self):
        return f'{self.username} ({self.role})'


class PushSubscription(models.Model):
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField()
    p256dh   = models.TextField()
    auth     = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'endpoint']

    def __str__(self):
        return f'Push sub for {self.user_id}'
