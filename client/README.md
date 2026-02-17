# HKids Platform - Client

The client is a React + TypeScript app that contains two user experiences:

- Public Reader experience for children
- Back-office dashboard for admin/editor content management

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router

## Implemented Features

### Public Reader

- Story listing from `/api/public/books`
- Category listing from `/api/public/categories`
- Search + age + language + category filters
- Story reader route (`/stories/:id`) with page navigation

### Back-office

- Admin/editor login (`/api/auth/login`)
- Session restore (`/api/auth/me`)
- List books (`/api/admin/books`)
- Create draft books
- Quick edit title/description
- Publish and archive actions (role dependent)

## Prerequisites

- Node.js 18+
- Backend API running (default: `http://localhost:5000`)

## Setup

```powershell
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Run

```powershell
# Development
npm run dev

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

Default local URL:

- `http://localhost:5173`

## API Endpoints Used by Client

- `GET /api/public/books`
- `GET /api/public/categories`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/admin/books`
- `POST /api/admin/books`
- `PATCH /api/admin/books/:id`
- `POST /api/admin/books/:id/publish`

## Known POC Gaps

- No production media upload flow yet (image URLs are currently external links)
- Back-office edits are intentionally lightweight (prompt-based quick edit)
- No automated frontend tests yet

## Deployment Profile

For containerized tablet deployment, see:

- `../docs/DEPLOYMENT_TABLET_PROFILE.md`
- `../deploy/docker-compose.tablet.yml`

For full platform context, see `../README.md` and `../docs/` at repository root.
