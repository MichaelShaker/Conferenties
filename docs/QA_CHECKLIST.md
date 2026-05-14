# QA checklist

Run this after backend/frontend changes and before using real event data.

## Setup

1. Start the stack with `docker compose -f compose.ci.yml up --build`.
2. Optional repeatable data: run `database/seed.test.sql` against the `conferenties` database.
3. Test admin login: `qa-admin@example.com` / `Admin123!`.
4. Test user login: `qa-user@example.com` / `User123!`.

## Core flows

1. Register a new user, log in, and complete the profile.
2. Confirm profile fields show on the account page, including shirt size, transport, and email preference.
3. Create a test event as admin with payment link, deadline, email subject, and email body.
4. Send a test email to yourself from the admin event list.
5. Register for the event as a user with shirt size and transport choice.
6. Upload a payment proof image.
7. Approve the registration as admin and confirm the user receives/records the status.
8. Reject another registration and confirm the rejection path.
9. Export CSV with each filter: all, location list, payment pending, proof uploaded, bus, shirt sizes, cancelled.
10. Connect Google Sheets, sync the event, and confirm the tabs exist: all registrations, location list, bus, shirt sizes.
11. Open `/admin/email-logs` and confirm sent/failed email records appear.
12. Open `/admin/audit` and confirm admin actions are recorded.
13. Open `/admin/users`, change a user's role/email preference, then change it back.
14. Archive an event and confirm it disappears from event lists while registrations remain in admin history.
15. Click an email unsubscribe link and confirm the user newsletter setting turns off.

## Before deploy

1. Run `./scripts/backup-mysql.sh`.
2. Run `npm run build` in `frontend`.
3. Load the backend once with strong local env values.
4. Check `/admin/status` for database, email, Google Sheets, failed emails, and sheet sync errors.
