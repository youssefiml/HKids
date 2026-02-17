# HKids Platform - Backend API

The backend is a Node.js + Express + TypeScript REST API for the HKids reading platform.

It powers:

- Public reader catalog endpoints
- Back-office authentication and content management
- Parent, child profile, and device pairing workflows
- Daily reading-time enforcement for paired devices

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Zod validation
- JWT authentication

## Project Structure

```text
server/
  src/
    app.ts
    server.ts
    config/
    controllers/
    middlewares/
    modules/
    routes/
    services/
    utils/
    scripts/seed.ts
```

## Prerequisites

- Node.js 18+
- MongoDB 6+

## Setup

```powershell
cd server
npm install
```

Create `server/.env` (or copy from `.env.example`):

```env
MONGO_URI=mongodb://localhost:27017/hkids
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=7d
PARENT_JWT_EXPIRES_IN=12h
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173,http://localhost:3000
```

## Run

```powershell
# Development
npm run dev

# Seed sample data
npm run seed

# Build
npm run build

# Run production build
npm start
```

## Health Check

- `GET /health`

## API Overview

Base URL: `http://localhost:5000/api`

### Admin/Auth Domain

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/logout`

### Admin/Back-office Content Domain

- `GET /admin/books`
- `GET /admin/books/:id`
- `POST /admin/books`
- `PATCH /admin/books/:id`
- `POST /admin/books/:id/publish` (admin role)
- `DELETE /admin/books/:id` (admin role)
- `GET /admin/categories`
- `GET /admin/categories/:id`
- `POST /admin/categories` (admin role)
- `PATCH /admin/categories/:id` (admin role)
- `DELETE /admin/categories/:id` (admin role)

### Parent Domain

- `POST /parent/auth/register`
- `POST /parent/auth/login`
- `GET /parent/auth/me`
- `GET /parent/children`
- `POST /parent/children`
- `PATCH /parent/children/:id`
- `DELETE /parent/children/:id`
- `POST /parent/devices/pairing-codes`
- `GET /parent/devices`
- `PATCH /parent/devices/:deviceId/child`

### Public Reader Domain

- `POST /public/pairing/claim`
- `GET /public/reader/context`
- `POST /public/reader/usage`
- `GET /public/books`
- `GET /public/books/:id`
- `GET /public/categories`

## Default Seed Credentials

When seeding a fresh database, the script ensures this admin account exists:

- Email: `admin@hkids.com`
- Password: `admin123`

Change this password for any shared or production environment.

## Security Controls Implemented

- JWT authentication for admin/editor and parent scopes
- Role-based access checks for admin APIs
- Request validation with Zod
- In-memory rate limiting (global + auth attempts)
- CORS allow-list support via `FRONTEND_URL`
- Centralized error handling

## Additional Documentation

- Root overview: `../README.md`
- Technical architecture: `../docs/TECHNICAL_ARCHITECTURE.md`
- Stack justification: `../docs/STACK_JUSTIFICATION.md`
- Hardware assumptions: `../docs/HARDWARE_INTEGRATION_ASSUMPTIONS.md`
- Tablet deployment profile: `../docs/DEPLOYMENT_TABLET_PROFILE.md`
