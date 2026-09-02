# E-Card — School Conduct & Permission Management

E-Card is a school operations application for recording student appreciation and sanction marks, maintaining transparent conduct history, notifying parents, issuing campus-exit permission cards, and generating periodic reports.

## Product

- Administration dashboard with student monitoring
- Student portal with personal conduct history
- Appreciation and sanction workflows
- Parent-notification integration point via SMTP
- Digital permission cards with approval/rejection workflow
- Monthly, termly, and annual PDF reports
- Responsive modern frontend
- Persistent SQLite backend
- Role-based access control and HTTP-only authentication cookie
- Zod request validation
- Audit-friendly event history
- Health endpoint for deployment monitoring

## Architecture

```text
Browser
  ├── Administration panel
  └── Student portal
          │
          ▼
     Express API
     ├── Auth / RBAC
     ├── Validation
     ├── Student routes
     ├── Conduct routes
     ├── Permission routes
     ├── Report routes
     └── Notification routes
          │
          ▼
       SQLite DB
          │
          ├── Users
          ├── Students
          ├── Events
          └── Permissions

External services: SMTP for parent email; PDFKit for reports.
```

## Requirements

- Node.js 20+
- npm

## Installation

```bash
npm install
cp .env.example .env
```

Set a random `JWT_SECRET` of at least 32 characters before starting the server.

## Development

```bash
npm run dev
```

The static frontend can also be served by the production Express entrypoint.

## Production server

```bash
npm start
```

The default port is `3000`. A reverse proxy should provide HTTPS in production.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs these checks on pushes and pull requests.

## Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime environment; enables secure cookies in production |
| `PORT` | HTTP server port |
| `JWT_SECRET` | Required signing secret; minimum 32 characters |
| `DB_FILE` | SQLite database file path |
| `APP_ORIGIN` | Allowed frontend origin for CORS |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Whether SMTP uses TLS directly |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Verified sender address |

## API overview

- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — sign out
- `GET /api/auth/me` — current user
- `GET /api/health` — health and database check
- `GET /api/students` — administration student list
- `GET /api/students/:id/history` — authorized conduct history
- `POST /api/events` — record appreciation or sanction
- `GET /api/permissions` — authorized permission cards
- `POST /api/permissions` — create a permission card
- `PATCH /api/permissions/:code` — approve or reject a card
- `GET /api/reports/:period.pdf` — monthly, termly, or annual PDF
- `POST /api/notifications/test` — test configured SMTP delivery

## Demo data

The backend seeds sample students only when the database is empty. Real deployments should provision real accounts through a secure administrative process rather than committing credentials to source control.

## Security and privacy

Student records are sensitive. Production deployments should use HTTPS, strong secrets stored outside source control, least-privilege access, database backups, retention/deletion policies, audit monitoring, rate limiting at the edge, and school-approved privacy procedures. Do not put real parent contact information into demo fixtures.

## Docker

A production-oriented Docker image and Compose example are included. Persist the `/data` volume and provide secrets through the deployment environment.
