# Fix487 — IT Support Field Service Management

A SaaS application for managing IT support operations — tickets, technician allocation, SLA tracking, team calendar, knowledge base, and reports.

---

## Stack

**Backend**
- Python 3.13 / Django 5 / Django REST Framework
- PostgreSQL
- JWT Authentication (djangorestframework-simplejwt)
- openpyxl (Excel export) / reportlab (PDF export)
- Gunicorn

**Frontend**
- React 18 / Vite
- CSS Modules
- React Router v6
- Axios

**Deploy**
- Backend: Railway
- Frontend: Cloudflare Pages

---

## Features

- **Multi-role system** — Admin, Dispatcher, Technician, Client
- **Ticket management** — create, assign, update status, internal/public notes, attachments
- **SLA tracking** — response and resolution SLA per priority, breach detection
- **Time logging** — technicians log hours per ticket
- **Team calendar** — monthly/weekly view of interventions
- **Knowledge Base** — articles with categories and full-text search
- **Client & Company management** — per-company SLA configuration
- **Reports** — Excel/PDF export for tickets, SLA compliance, technician hours
- **Internal notifications**

---

## Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access — users, configuration, SLA, all tickets, global reports |
| `dispatcher` | Create tickets, assign technicians, view all tickets, calendar |
| `technician` | View assigned tickets, update status, add notes, log time |
| `client` | Submit tickets, track own ticket status, access Knowledge Base |

---

## Ticket Lifecycle

```
new → assigned → in_progress → on_hold → resolved → closed
```

---

## Priority & SLA (defaults)

| Priority | Response | Resolution |
|----------|----------|------------|
| Critical | 1h | 4h |
| High | 4h | 24h |
| Medium | 8h | 72h |
| Low | 24h | 168h |

SLA is configurable per company.

---

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js 20+
- PostgreSQL

### Backend setup

```bash
cd Fix487
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY

python manage.py migrate
python init_db.py
python seed_data.py
python manage.py runserver
```

### Frontend setup

```bash
cd Fix487/frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/fix487
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

---

## Test Accounts

| Username | Password | Role |
|----------|----------|------|
| sorin487 | Admin2026! | Admin |
| alex.dispatcher | Dispatch2026! | Dispatcher |
| mihai.tech | Tech2026! | Technician |
| ana.tech | Tech2026! | Technician |
| client.nexoria | Client2026! | Client |

---

## Project Structure

```
Fix487/
├── fix487/              # Django settings, urls, wsgi
├── accounts/            # User, Company, auth
├── tickets/             # Ticket, Note, TimeLog, Category
├── knowledge/           # KBArticle
├── reports/             # Export views
├── frontend/            # React + Vite app
│   └── src/
│       ├── api/         # Axios API calls
│       ├── components/  # Layout, Sidebar
│       ├── pages/       # Page components
│       ├── context/     # AuthContext
│       └── styles/      # Global CSS variables
├── init_db.py
├── seed_data.py
├── requirements.txt
└── .env
```

---

## License

MIT
