# CRTMS — Course Registration & Timetable Management System

A front-end web application, written in TypeScript with Next.js, that lets students register for courses with real-time clash detection and lets administrators generate a clash-free departmental timetable automatically.

All data is stored in the browser (`localStorage`), so the system needs no server or database. See Chapter Four of the project report for the full description.

## Demo accounts

| Role | Login | Password |
|---|---|---|
| Student (300 level, no courses yet) | `CSC/2023/001` | `password123` |
| Any other student, e.g. | `CSC/2024/007` | `password123` |
| Administrator | `admin` | `admin123` |

To see a clash: sign in as `CSC/2023/001`, add **CSC 311**, then try to add **CSC 313** (both are held on Thursday 14:00–16:00).

**Statistics → Reset demo data** restores the original data.

## Running it

Requires Node.js 20 or later.

```bash
npm install
npm run dev        # development server at http://localhost:3000
npm test           # 19 automated tests (Jest + React Testing Library)
npm run build      # static site in out/
npm start          # serve out/ locally
```

Sign-in uses the browser's Web Crypto API, which only works on `https://` addresses or on `localhost`.

## Deploying

`npm run build` produces a folder of static files (`out/`) that any static host can serve. With Vercel, push the project to GitHub, then choose **Add New → Project** on vercel.com and import the repository. Vercel detects Next.js and deploys it automatically.

## Project structure

```
app/          pages (login, student, admin)
components/   interface components (AppShell, CourseList, TimetableGrid, ...)
lib/          logic and data: types, clash detection, registration,
              timetable generation, validation, auth, storage
data/         seed.json (demo department: 25 courses, 160 students)
scripts/      generate-seed.ts (rebuilds seed.json: npm run seed)
__tests__/    automated tests
screenshots/  the figures used in Chapter Four
```

## Limitations

This is a prototype. Because data lives in one browser, registrations made on one device are not visible on another. Access control also runs in the browser, so it could be bypassed by a technically skilled user. For institution-wide use, add a server-side database and authentication, as recommended in Chapter Five.
# course-registration
