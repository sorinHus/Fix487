from .models import Notification
from accounts.push import send_push_to_user


def _notify(user, title, body='', ticket=None):
    if user:
        Notification.objects.create(user=user, title=title, body=body, ticket=ticket)
        url = f'/tickets/{ticket.id}' if ticket else '/'
        send_push_to_user(user, title, body, url)


def on_ticket_assigned(ticket, actor):
    if ticket.assigned_to and ticket.assigned_to != actor:
        _notify(
            ticket.assigned_to,
            f'Ticket #{ticket.id} assigned to you',
            ticket.title,
            ticket,
        )


def on_comment_added(ticket, actor, body=''):
    recipients = set()
    if ticket.created_by and ticket.created_by != actor:
        recipients.add(ticket.created_by)
    if ticket.assigned_to and ticket.assigned_to != actor:
        recipients.add(ticket.assigned_to)
    preview = body[:150] if body else ''
    for user in recipients:
        _notify(user, f'New comment on ticket #{ticket.id}', preview, ticket)


def on_ticket_resolved(ticket, actor):
    if ticket.created_by and ticket.created_by != actor:
        _notify(
            ticket.created_by,
            f'Ticket #{ticket.id} has been resolved',
            ticket.title,
            ticket,
        )
