"""
Seed data — companies, users, ticket categories.
Idempotent: safe to run multiple times.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fix487.settings')
django.setup()

from accounts.models import Company, User
from tickets.models import Category, Ticket
from knowledge.models import KBCategory, KBArticle


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
    return {c.name: c for c in Category.objects.all()}


def seed_tickets(companies, categories):
    admin = User.objects.filter(is_superuser=True).first()
    tech1 = User.objects.filter(username='tech1').first()
    tech2 = User.objects.filter(username='tech2').first()
    client_acme = User.objects.filter(username='client_acme').first()
    client_globex = User.objects.filter(username='client_globex').first()

    acme = companies.get('Acme Corp')
    globex = companies.get('Globex Solutions')
    initech = companies.get('Initech Ltd')

    tickets = [
        {
            'title': 'Laptop won\'t boot after Windows update',
            'description': 'After the latest Windows 11 update, the laptop gets stuck on the loading screen and cannot boot into the OS.',
            'status': 'new', 'priority': 'high',
            'category': categories.get('Software'),
            'company': acme, 'created_by': client_acme or admin,
        },
        {
            'title': 'Office printer offline — floor 3',
            'description': 'The HP LaserJet on floor 3 shows as offline on all workstations. Restarting the printer did not help.',
            'status': 'assigned', 'priority': 'medium',
            'category': categories.get('Printer & Peripherals'),
            'company': acme, 'created_by': client_acme or admin,
            'assigned_to': tech1,
        },
        {
            'title': 'VPN connection drops every 30 minutes',
            'description': 'Remote workers report that the VPN disconnects every 30 minutes and requires manual reconnection.',
            'status': 'in_progress', 'priority': 'high',
            'category': categories.get('Network'),
            'company': globex, 'created_by': client_globex or admin,
            'assigned_to': tech2,
        },
        {
            'title': 'New employee account setup — Maria Nica',
            'description': 'Please create AD account, email, and grant access to shared drives for new hire starting Monday.',
            'status': 'in_progress', 'priority': 'medium',
            'category': categories.get('Access & Permissions'),
            'company': globex, 'created_by': client_globex or admin,
            'assigned_to': tech1,
        },
        {
            'title': 'Outlook not syncing with Exchange server',
            'description': 'Three users in the finance department cannot send or receive emails since this morning.',
            'status': 'on_hold', 'priority': 'critical',
            'category': categories.get('Email & Communication'),
            'company': initech, 'created_by': admin,
            'assigned_to': tech2,
        },
        {
            'title': 'Workstation RAM upgrade — accounting dept',
            'description': 'Accounting workstations running slow. Requesting RAM upgrade from 8GB to 16GB on 5 machines.',
            'status': 'resolved', 'priority': 'low',
            'category': categories.get('Hardware'),
            'company': acme, 'created_by': client_acme or admin,
            'assigned_to': tech1,
        },
        {
            'title': 'Suspicious login attempts detected',
            'description': 'Azure AD flagged multiple failed login attempts on the CFO\'s account from an unknown IP.',
            'status': 'resolved', 'priority': 'critical',
            'category': categories.get('Security'),
            'company': globex, 'created_by': admin,
            'assigned_to': tech2,
        },
        {
            'title': 'WiFi signal weak in conference rooms B2 and B3',
            'description': 'Employees in conference rooms B2 and B3 report very weak WiFi. Video calls drop frequently.',
            'status': 'closed', 'priority': 'medium',
            'category': categories.get('Network'),
            'company': initech, 'created_by': admin,
            'assigned_to': tech1,
        },
    ]

    count = 0
    for data in tickets:
        if not Ticket.objects.filter(title=data['title']).exists():
            Ticket.objects.create(**data)
            count += 1
    return count


def seed_kb():
    admin = User.objects.filter(is_superuser=True).first()
    tech1 = User.objects.filter(username='tech1').first()

    cat_hw, _ = KBCategory.objects.get_or_create(name='Hardware')
    cat_sw, _ = KBCategory.objects.get_or_create(name='Software')
    cat_net, _ = KBCategory.objects.get_or_create(name='Network')
    cat_sec, _ = KBCategory.objects.get_or_create(name='Security')

    articles = [
        {
            'title': 'How to perform a hard reset on a Windows laptop',
            'body': 'A hard reset can resolve many boot and freeze issues.\n\n1. Hold the power button for 10 seconds until the laptop shuts off.\n2. Disconnect all external devices (USB drives, monitors, chargers).\n3. Remove the battery if it is removable, wait 30 seconds, then reinsert it.\n4. Press the power button to restart.\n5. If the issue persists, boot into Safe Mode by pressing F8 during startup.',
            'category': cat_hw, 'author': tech1 or admin, 'is_published': True,
        },
        {
            'title': 'Resetting a user password in Active Directory',
            'body': 'Follow these steps to reset a user password in Active Directory Users and Computers (ADUC):\n\n1. Open ADUC on the domain controller or a management PC.\n2. Search for the user account by name or username.\n3. Right-click the account and select "Reset Password".\n4. Enter the new temporary password and confirm it.\n5. Check "User must change password at next logon".\n6. Click OK and inform the user of their temporary password.',
            'category': cat_sw, 'author': admin, 'is_published': True,
        },
        {
            'title': 'Troubleshooting VPN connection issues',
            'body': 'If users report frequent VPN disconnections or inability to connect:\n\n1. Verify the user\'s internet connection is stable.\n2. Restart the VPN client application.\n3. Check that the VPN server address and credentials are correct.\n4. Temporarily disable the firewall or antivirus and retry.\n5. Reinstall the VPN client if issues persist.\n6. Check VPN server logs for authentication failures or certificate expiry.',
            'category': cat_net, 'author': tech1 or admin, 'is_published': True,
        },
        {
            'title': 'Responding to a suspected phishing email',
            'body': 'When a user reports a suspicious email:\n\n1. Do NOT click any links or download attachments.\n2. Forward the email as an attachment to the security team.\n3. Delete the email from the inbox immediately.\n4. If credentials were entered on a suspicious site, reset the password immediately.\n5. Run a full antivirus scan on the workstation.\n6. Document the incident in the ticketing system.',
            'category': cat_sec, 'author': admin, 'is_published': True,
        },
        {
            'title': 'Printer offline troubleshooting guide',
            'body': 'Steps to bring an offline printer back online:\n\n1. Check that the printer is powered on and all cables are connected.\n2. On Windows: go to Devices and Printers, right-click the printer, select "See what\'s printing".\n3. Click Printer menu and uncheck "Use Printer Offline".\n4. Clear the print queue if there are stuck jobs.\n5. Restart the Print Spooler service (services.msc → Print Spooler → Restart).\n6. If network printer, verify it has the correct IP and is reachable via ping.',
            'category': cat_hw, 'author': tech1 or admin, 'is_published': True,
        },
        {
            'title': 'Internal: SLA escalation procedure',
            'body': 'This article is for internal staff only.\n\nWhen a ticket is approaching SLA breach:\n\n1. The system flags the ticket with sla_breach=True.\n2. The dispatcher receives a notification and must reassign or escalate.\n3. For critical tickets: notify the senior technician and account manager immediately.\n4. Document all escalation steps in internal ticket comments.\n5. After resolution, conduct a post-mortem if SLA was breached.',
            'category': cat_sec, 'author': admin, 'is_published': False,
        },
    ]

    count = 0
    for data in articles:
        if not KBArticle.objects.filter(title=data['title']).exists():
            KBArticle.objects.create(**data)
            count += 1
    return count


if __name__ == '__main__':
    print('Seeding companies...')
    companies = seed_companies()
    print(f'  {len(companies)} companies ready.')

    print('Seeding users...')
    seed_users(companies)
    print('  Users ready.')

    print('Seeding ticket categories...')
    categories = seed_categories()
    print('  Categories ready.')

    print('Seeding tickets...')
    count = seed_tickets(companies, categories)
    print(f'  {count} tickets created.')

    print('Seeding knowledge base articles...')
    count = seed_kb()
    print(f'  {count} articles created.')

    print('Done.')
