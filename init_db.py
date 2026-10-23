import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fix487.settings')
django.setup()

from accounts.models import User

password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not User.objects.filter(username='sorin487').exists():
    if not password:
        raise SystemExit('DJANGO_SUPERUSER_PASSWORD is required to create the superuser.')
    User.objects.create_superuser(
        username='sorin487',
        email='admin@fix487.com',
        password=password,
        role='admin',
        first_name='Sorin',
        last_name='Admin',
    )
    print('Superuser sorin487 created.')
else:
    print('Superuser already exists.')
