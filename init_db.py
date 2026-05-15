import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fix487.settings')
django.setup()

from accounts.models import User

if not User.objects.filter(username='sorin487').exists():
    User.objects.create_superuser(
        username='sorin487',
        email='admin@fix487.com',
        password='Admin2026!',
        role='admin',
        first_name='Sorin',
        last_name='Admin',
    )
    print('Superuser sorin487 created.')
else:
    print('Superuser already exists.')
