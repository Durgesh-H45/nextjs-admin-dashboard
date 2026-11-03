# Next.js Admin Dashboard

Admin Dashboard interface for managing users (View, Add, and Delete) connected to your NestJS 10 + Prisma + PostgreSQL backend.

## Features

- **Admin-Only Authentication**:
  - Secure login using NestJS `/users/login`.
  - Verifies that the authenticated account has an `ADMIN` or `SUPER_ADMIN` role.
  - Denies access with clear error feedback if a regular user tries to log in.
  - Stores JWT token in an `httpOnly`, `SameSite=Lax` secure cookie.
- **View Users (`GET /admin/users`)**:
  - Real-time table displaying ID, full name, email, colored role badges (`USER`, `ADMIN`, `SUPER_ADMIN`, etc.), account status (`Active` / `Blocked`), and creation date.
  - Search by email, name, or ID.
  - Filter by role and status.
  - Summary metrics: Total Users, Admins, Regular Users, and Blocked accounts.
- **Add User (`POST /admin/users`)**:
  - Modal form to register new users with email, password, optional first/last name, role selection, and blocked state.
  - Instant validation and auto-refresh of table data.
- **Delete User (`DELETE /admin/users/:id`)**:
  - Confirmation modal with user details.
  - Safety protection preventing logged-in admins from accidentally deleting their own account.
- **Render Cold-Start & Health Monitoring**:
  - Live backend health pill and cold-start counter during spin-up.
  - 70s timeout tolerance for Render free tier sleep cycles.

## Quick Start

### 1. Configure Backend URL
Check `.env.local`:
```env
# Default: Render deployed backend
NEST_API_URL=https://nestjs-postgres-prisma.onrender.com

# If running NestJS backend locally on your machine, set:
# NEST_API_URL=http://localhost:3000
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or whichever port Next.js starts on) to access the Admin Console.

### 3. Build & Production Run
```bash
npm run build
npm run start
```
