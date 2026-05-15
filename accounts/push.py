import json
from django.conf import settings


def send_push_to_user(user, title, body='', url='/'):
    private_key = getattr(settings, 'VAPID_PRIVATE_KEY', '')
    if not private_key:
        return
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        return

    claims_email = getattr(settings, 'VAPID_CLAIMS_EMAIL', 'admin@fix487.com')
    payload = json.dumps({'title': title, 'body': body, 'url': url})

    expired = []
    for sub in user.push_subscriptions.all():
        try:
            webpush(
                subscription_info={'endpoint': sub.endpoint, 'keys': {'p256dh': sub.p256dh, 'auth': sub.auth}},
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={'sub': f'mailto:{claims_email}'},
            )
        except WebPushException as e:
            if e.response is not None and e.response.status_code in (404, 410):
                expired.append(sub.pk)
        except Exception:
            pass

    if expired:
        from .models import PushSubscription
        PushSubscription.objects.filter(pk__in=expired).delete()
