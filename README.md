# Engineering Student Attendance Tracker

Responsive full-stack attendance tracker for engineering students built with Node.js, Express, Prisma, React, and Tailwind CSS.

## Architecture

- `server/`: Express API, Prisma schema, JWT auth, attendance metrics.
- `client/`: React app with dashboard, calendar, analytics, settings, and login.
- SQLite is used by default for local development through Prisma.

## Core Data Model

- Users: username, hashed password, target percentage.
- Timetable: day of week, period number, subject name.
- Holidays: date, holiday name, official flag.
- AttendanceLog: date, period number, subject name, attended flag.

## Run locally

1. Install dependencies in the repo root.
2. Copy `server/.env.example` to `server/.env` and set `JWT_SECRET`.
3. Run Prisma migration and seed data from the `server` package.
4. Start the root dev script.

## Notes

- Holiday dates are blocked in the calendar and excluded from attendance writes.
- The dashboard includes a bunk meter that calculates safe skips or required consecutive attendance.
- The current design is ready for extension to multi-student deployments.

## Hello,MR intelligent ,if you want any other features you may add them 
