# E-Card backend

The backend provides authenticated school administration and student APIs, SQLite persistence, conduct audit history, permission-card workflows, PDF report generation, and optional SMTP parent notifications.

## Run

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set a strong `JWT_SECRET`.
4. Run `npm start`.

## Production requirements

- Replace the development JWT secret.
- Configure a managed database or durable SQLite volume.
- Configure HTTPS at the reverse proxy.
- Configure SMTP credentials for parent notifications.
- Create administrator and student users using the deployment's secure provisioning process.
- Restrict access to student records according to school policy and applicable privacy law.
