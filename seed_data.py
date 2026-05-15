"""
Seed data — companies, users, ticket categories.
Idempotent: safe to run multiple times.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fix487.settings')
django.setup()

from accounts.models import Company, User
from tickets.models import Category


def seed_companies():
    companies = [
        {
            'name': 'Acme Corp',
            'email': 'it@acmecorp.com',
            'phone': '+40 21 000 0001',
            'address': '10 Industry Blvd, Bucharest',
            'sla_response_critical': 1,
            'sla_response_high': 4,
            'sla_resolution_critical': 4,
            'sla_resolution_high': 24,
        },
        {
            'name': 'Globex Solutions',
            'email': 'support@globex.com',
            'phone': '+40 21 000 0002',
            'address': '55 Tech Park, Cluj-Napoca',
            'sla_response_critical': 2,
            'sla_response_high': 8,
            'sla_resolution_critical': 8,
            'sla_resolution_high': 48,
        },
        {
            'name': 'Initech Ltd',
            'email': 'helpdesk@initech.com',
            'phone': '+40 21 000 0003',
            'address': '3 Commerce St, Timișoara',
            'sla_response_critical': 1,
            'sla_response_high': 4,
            'sla_resolution_critical': 6,
            'sla_resolution_high': 32,
        },
    ]
    created = []
    for data in companies:
        obj, new = Company.objects.get_or_create(name=data['name'], defaults=data)
        created.append((obj, new))
    return {c.name: c for c, _ in created}


def seed_users(companies):
    users = [
        {
            'username': 'dispatcher1',
            'first_name': 'Ana',
            'last_name': 'Popescu',
            'email': 'ana.popescu@fix487.com',
            'role': 'dispatcher',
            'position': 'Support Dispatcher',
            'password': 'Dispatcher2026!',
            'company': None,
        },
        {
            'username': 'tech1',
            'first_name': 'Mihai',
            'last_name': 'Ionescu',
            'email': 'mihai.ionescu@fix487.com',
            'role': 'technician',
            'position': 'Field Technician',
            'password': 'Tech2026!',
            'company': None,
        },
        {
            'username': 'tech2',
            'first_name': 'Andrei',
            'last_name': 'Constantin',
            'email': 'andrei.constantin@fix487.com',
            'role': 'technician',
            'position': 'Senior Technician',
            'password': 'Tech2026!',
            'company': None,
        },
        {
            'username': 'client_acme',
            'first_name': 'Radu',
            'last_name': 'Dumitrescu',
            'email': 'radu.d@acmecorp.com',
            'role': 'client',
            'position': 'IT Manager',
            'password': 'Client2026!',
            'company': companies.get('Acme Corp'),
        },
        {
            'username': 'client_globex',
            'first_name': 'Elena',
            'last_name': 'Marin',
            'email': 'elena.m@globex.com',
            'role': 'client',
            'position': 'Operations Lead',
            'password': 'Client2026!',
            'company': companies.get('Globex Solutions'),
        },
    ]
    for data in users:
        password = data.pop('password')
        obj, created = User.objects.get_or_create(
            username=data['username'],
            defaults=data,
        )
        if created:
            obj.set_password(password)
            obj.save()


def seed_categories():
    categories = [
        'Hardware',
        'Software',
        'Network',
        'Email & Communication',
        'Access & Permissions',
        'Printer & Peripherals',
        'Security',
        'Other',
    ]
    for name in categories:
        Category.objects.get_or_create(name=name)


if __name__ == '__main__':
    print('Seeding companies...')
    companies = seed_companies()
    print(f'  {len(companies)} companies ready.')

    print('Seeding users...')
    seed_users(companies)
    print('  Users ready.')

    print('Seeding ticket categories...')
    seed_categories()
    print('  Categories ready.')

    print('Done.')
