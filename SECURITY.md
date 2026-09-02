# Security Policy

## Reporting

Please do not publish security vulnerabilities involving student or parent data in public issues. Contact the project owner privately with a concise description, reproduction steps, affected endpoint, and impact.

## Deployment expectations

- Use HTTPS.
- Set a unique JWT secret of at least 32 characters.
- Keep `.env` and database files out of source control.
- Use least-privilege administrator accounts.
- Back up and protect the database.
- Configure SMTP credentials as deployment secrets.
- Keep Node.js and dependencies updated.
- Do not use real student data in demo fixtures.
