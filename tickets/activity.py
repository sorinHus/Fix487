from .models import TicketActivity

STATUS_LABELS = {
    'new': 'New', 'assigned': 'Assigned', 'in_progress': 'In Progress',
    'on_hold': 'On Hold', 'resolved': 'Resolved', 'closed': 'Closed',
}
PRIORITY_LABELS = {
    'low': 'Low', 'medium': 'Medium', 'high': 'High', 'critical': 'Critical',
}


def log(ticket, actor, action, detail=''):
    TicketActivity.objects.create(ticket=ticket, actor=actor, action=action, detail=detail)


def log_created(ticket, actor):
    log(ticket, actor, TicketActivity.Action.CREATED)


def log_changes(ticket, actor, old_data):
    if old_data.get('status') != ticket.status:
        old = STATUS_LABELS.get(old_data['status'], old_data['status'])
        new = STATUS_LABELS.get(ticket.status, ticket.status)
        log(ticket, actor, TicketActivity.Action.STATUS_CHANGED, f'{old} → {new}')
        if ticket.status == 'resolved':
            log(ticket, actor, TicketActivity.Action.RESOLVED)

    if old_data.get('assigned_to_id') != ticket.assigned_to_id:
        if ticket.assigned_to:
            name = f'{ticket.assigned_to.first_name} {ticket.assigned_to.last_name}'.strip() or ticket.assigned_to.username
            log(ticket, actor, TicketActivity.Action.ASSIGNED, name)
        else:
            log(ticket, actor, TicketActivity.Action.UNASSIGNED)

    if old_data.get('priority') != ticket.priority:
        old = PRIORITY_LABELS.get(old_data['priority'], old_data['priority'])
        new = PRIORITY_LABELS.get(ticket.priority, ticket.priority)
        log(ticket, actor, TicketActivity.Action.PRIORITY_CHANGED, f'{old} → {new}')


def log_comment(ticket, actor):
    log(ticket, actor, TicketActivity.Action.COMMENT_ADDED)
