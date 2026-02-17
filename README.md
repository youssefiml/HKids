# HKids Platform

Last updated: February 10, 2026  
Project start date: February 6, 2026

HKids is a child-friendly digital reading platform designed to help young children enjoy books independently in a safe and focused environment.

## 1. Problem Statement

Young children often depend on adults for daily reading time. In many families, regular shared reading is difficult because of work schedules and time constraints.

Common fallback solutions (generic tablets and open app ecosystems) introduce additional problems:

- weak content boundaries for very young readers
- high distraction risk from non-reading apps
- increased screen exposure without reading-specific controls

HKids addresses this by combining:

- age-appropriate and pre-approved content
- controlled reader access and device pairing
- a dedicated reading flow with minimal distractions
- practical tooling for parent and admin supervision

## 2. Expected Deliverables

The platform must provide:

- a functional POC for immersive reading
- a content management back-office
- a documented technical architecture
- a justified technical stack selection
- a hardware-agnostic integration strategy

Current repository coverage:

- Reader POC: implemented (`client`)
- Back-office POC: implemented (`client` + `server`)
- Parent/device pairing and reading limits: implemented (`server`)
- Architecture + stack + hardware documentation: added in `docs/`

## 3. Functional Requirements

Required capability | Status
--- | ---
Distraction-free reading interface for children | Implemented POC
Structured page progression (book-like navigation) | Implemented POC
Restricted access to validated/approved content | Implemented (`published` filtering + validation)
Back-office content management (create/update/publish/archive books) | Implemented POC
Category management and organization | Implemented API
Parent-controlled child profile and device pairing | Implemented API
Daily reading-time control per child profile | Implemented API
Future extensibility (audio narration, dashboard, analytics) | Planned architecture points included

## 4. Technical Constraints and Architecture Direction

To stay hardware-independent and portable, HKids uses web technologies with clear API boundaries:

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Validation/Auth: Zod + JWT

Architecture goals:

- modular backend domains (auth, books, categories, parent, devices)
- stateless API layer for flexible deployment
- lightweight client for mid-range/low-power devices
- no hard dependency on a single tablet vendor or operating system

## 5. Documentation Deliverables

- Technical architecture and diagrams: `docs/TECHNICAL_ARCHITECTURE.md`
- Stack justification: `docs/STACK_JUSTIFICATION.md`
- Hardware integration assumptions: `docs/HARDWARE_INTEGRATION_ASSUMPTIONS.md`
- Tablet deployment profile: `docs/DEPLOYMENT_TABLET_PROFILE.md`
- Backend API guide: `server/README.md`
- Frontend setup and feature guide: `client/README.md`

## 6. Milestones and Timeline

Based on a two-week first-draft window from project start (February 6, 2026):

- Week 1 review target: February 13, 2026
- First draft submission target: February 20, 2026

Recommended first-draft acceptance criteria:

- end-to-end demo: public reading + admin publishing
- parent/device pairing demo with daily limit enforcement
- architecture, stack, and hardware assumptions documents completed
- setup instructions verified on a fresh local environment

## 7. Repository Structure

```text
HKids-Platform/
  client/   # Reader UI + back-office UI
  server/   # REST API, auth, content, parent/device services
  docs/     # Architecture, stack, and hardware documentation
```

## 8. Quick Start

```powershell
# Backend
cd server
npm install
npm run dev

# Frontend (new terminal)
cd client
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## 9. Tablet Deployment (Docker)

A concrete deployment profile for tablets/dedicated reader devices is available at:

- `docs/DEPLOYMENT_TABLET_PROFILE.md`
- `deploy/docker-compose.tablet.yml`
