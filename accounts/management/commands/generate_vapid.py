import base64
from django.core.management.base import BaseCommand
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import (
    Encoding, PrivateFormat, PublicFormat, NoEncryption
)


class Command(BaseCommand):
    help = 'Generate VAPID key pair for web push notifications'

    def handle(self, *args, **options):
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_key  = private_key.public_key()

        private_pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption()).decode()
        public_raw  = public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
        public_b64  = base64.urlsafe_b64encode(public_raw).rstrip(b'=').decode()

        self.stdout.write('\nAdd these to your .env and Railway environment variables:\n')
        self.stdout.write(self.style.SUCCESS(f'VAPID_PUBLIC_KEY={public_b64}'))
        self.stdout.write(self.style.SUCCESS(f'VAPID_CLAIMS_EMAIL=admin@fix487.com'))
        self.stdout.write('\nVAPID_PRIVATE_KEY (multi-line — paste as-is in .env):')
        self.stdout.write(self.style.WARNING(private_pem))
        self.stdout.write('\nFor Railway: paste the entire PEM including header/footer lines.\n')
