# Task Manager

A full stack task manager: users register, log in, and manage their own list of tasks. Built with React and TypeScript on the frontend, an Express and TypeScript API on the backend, and PostgreSQL for storage.

This started as my submission for the Lumaa Spring 2025 full stack coding challenge. The original submission is preserved on the [`submission-2025-02`](../../tree/submission-2025-02) branch. The code on `main` has since been fixed and cleaned up (see [What changed after the submission](#what-changed-after-the-submission)).

## Features

- Register and log in with a username and password. Passwords are hashed with bcrypt and never returned by the API.
- JWT authentication on every task route. Expired or invalid tokens sign the user out automatically.
- Create, view, edit, complete, and delete tasks.
- Each user sees and changes only their own tasks. Requests for someone else's task get a 404, so the API doesn't reveal which IDs exist.
- Input validation on both client and server, with clear error messages.
- 38 backend integration tests that run against a real PostgreSQL database, plus CI on every push.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, TypeScript, React Router 6, Axios, Vite |
| Backend | Node.js, Express 4, TypeScript, node-postgres, bcryptjs, jsonwebtoken |
| Database | PostgreSQL |
| Testing and CI | Vitest, Supertest, GitHub Actions |

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 13 or newer, running locally (or anywhere you can connect to)

## Setup

### 1. Create the database

Connect to Postgres as an admin user (for example `psql -U postgres`) and run:

```sql
CREATE USER taskapp WITH PASSWORD 'taskapp';
CREATE DATABASE taskmanager OWNER taskapp;
CREATE DATABASE taskmanager_test OWNER taskapp;  -- only needed to run the tests
```

Any user, password, and database name will work, as long as they match your `.env` in the next step.

### 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env      # then edit .env
npm run db:migrate        # creates the tables
npm run dev               # http://localhost:5000
```

`npm run db:migrate` applies [`backend/db/schema.sql`](backend/db/schema.sql). It's safe to run more than once.

To run a production build instead: `npm run build && npm start`.

### 3. Run the frontend

In a second terminal:

```bash
cd task-manager-frontend
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173, register an account, and you'll land on your task list.

The frontend talks to `http://localhost:5000` by default. To point it somewhere else, copy `.env.example` to `.env.local` and change `VITE_API_URL`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `JWT_SECRET` | Yes | | Secret used to sign tokens. Use a long random string. The server won't start without it. |
| `DATABASE_URL` | One of these | | Connection string, for example `postgres://taskapp:taskapp@localhost:5432/taskmanager` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | One of these | `localhost`, `5432` | Individual connection settings, used when `DATABASE_URL` isn't set |
| `PORT` | No | `5000` | Port the API listens on |
| `CORS_ORIGIN` | No | `http://localhost:5173` | The frontend's URL |
| `JWT_EXPIRES_IN` | No | `1h` | Token lifetime, for example `1h` or `7d` |

To generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend (`task-manager-frontend/.env.local`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000` | Base URL of the backend |

## Database schema

```sql
users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW()
)

tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    is_complete BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
)
```

Columns are snake_case in the database and camelCase in the API (`is_complete` becomes `isComplete`).

## API

All `/tasks` routes need an `Authorization: Bearer <token>` header.

| Method | Path | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | `{ username, password }` | `201` with `{ id, username }` | `400` invalid input, `409` username taken |
| `POST` | `/auth/login` | `{ username, password }` | `200` with `{ token, user }` | `400` missing fields, `401` wrong username or password |
| `GET` | `/tasks` | | `200` with your tasks | `401` |
| `POST` | `/tasks` | `{ title, description? }` | `201` with the new task | `400`, `401` |
| `PUT` | `/tasks/:id` | any of `{ title, description, isComplete }` | `200` with the updated task | `400`, `401`, `404` |
| `DELETE` | `/tasks/:id` | | `204` | `400`, `401`, `404` |
| `GET` | `/health` | | `200` with `{ status: "ok" }` | |

`PUT` is a partial update: send only the fields you want to change. Usernames are 3 to 50 characters and passwords at least 8.

## Testing

The backend tests are integration tests. They send real HTTP requests to the app and run real queries against a PostgreSQL test database, so they need the `taskmanager_test` database from step 1.

```bash
cd backend
npm test
```

By default the tests connect to `postgres://taskapp:taskapp@localhost:5432/taskmanager_test`. Set `TEST_DATABASE_URL` to use a different database. The tests empty the `users` and `tasks` tables before each test, so never point them at a database you care about.

The 38 tests cover:

- Registration: password hashing, duplicate usernames, input validation
- Login: valid credentials, and the same 401 for a wrong password or an unknown user
- Auth: missing, forged, expired, and malformed tokens
- Task CRUD: create, list, partial updates, edits, deletes, and validation
- Ownership: one user can't read, edit, or delete another user's tasks

Other checks:

```bash
cd backend && npm run typecheck
cd task-manager-frontend && npm run lint && npm run build
```

GitHub Actions runs all of these on every push and pull request, with a Postgres service container for the backend tests.

## Project structure

```
backend/
  db/schema.sql              table definitions
  src/
    app.ts                   Express app (routes, CORS, error handling)
    index.ts                 starts the server
    config.ts                reads and checks environment variables
    db.ts                    shared Postgres connection pool
    db/migrate.ts            applies schema.sql
    validation.ts            input rules
    controllers/             request handling for auth and tasks
    models/                  SQL queries for users and tasks
    middleware/              JWT check, async error forwarding
    routes/                  URL to controller wiring
  tests/                     integration tests
task-manager-frontend/
  src/
    api.ts                   Axios client and API calls
    auth/                    auth state, useAuth hook, route guards
    components/              Login, Register, Tasks, TaskItem, Navbar
```

## What changed after the submission

The original submission had bugs that kept the core flow from working. The main fixes:

- **Task routes weren't mounted.** The tasks router existed but was never added to the app, so every `/tasks` request returned 404.
- **No schema or setup instructions.** There was no way to create the tables. There's now a schema file, a migrate script, and this README.
- **Marking a task complete would have erased it.** The update query set every column, so sending only `isComplete` set the title to `NULL`. Updates are now partial.
- **`isComplete` never reached the UI.** Postgres folds unquoted column names to lowercase, so the API returned `iscomplete`. Columns are now snake_case and mapped to camelCase explicitly.
- **The navbar didn't update after login or logout** until the page was reloaded. Auth state now lives in React context.
- **The frontend wouldn't install.** `package-lock.json` didn't match `package.json`, so `npm ci` failed.
- **Security fixes:** the JWT secret fell back to the hard-coded string `"secret"`; login said whether a username existed; invalid tokens returned 400 instead of 401; expired sessions left the user on a broken page.
- **Cleanup:** one shared database pool instead of three, empty controller and model files filled in, async errors handled, duplicate API clients removed, Vite template leftovers deleted.
- **Added:** editing a task's title and description (part of the original requirements), loading and error states, the test suite, and CI.

## Notes

- The token is stored in `localStorage`, as the challenge asked. A production app would more likely use an httpOnly cookie so scripts on the page can't read the token.
- There's no rate limiting on login. A production app would add some to slow down password guessing.
