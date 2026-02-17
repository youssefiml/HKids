# HKids Stack Justification

Last updated: February 10, 2026

## 1. Selection Criteria

The selected stack is evaluated against four required criteria:

- scalability
- maintainability
- security
- hardware compatibility

## 2. Chosen Stack

Layer | Technology | Why it fits HKids
--- | --- | ---
Frontend | React + TypeScript + Vite | Fast iteration for POC, component reuse for reader/back-office, strong typing for safer UI evolution
Backend | Node.js + Express + TypeScript | Lightweight API runtime, clear middleware model, easy domain modularization
Database | MongoDB + Mongoose | Flexible document model for books/pages/categories and evolving child/device metadata
Validation | Zod | Single-source request validation, explicit API contracts
Authentication | JWT (admin + parent domains) | Stateless auth suitable for distributed deployment

## 3. Criteria Mapping

### 3.1 Scalability

- Stateless API supports horizontal scaling.
- MongoDB model scales well for read-heavy catalog queries.
- Public reader and back-office share the same API with role-based partitioning.

### 3.2 Maintainability

- TypeScript across frontend/backend reduces integration bugs.
- Route-controller-service split keeps business logic testable and isolated.
- Domain modules (`books`, `categories`, `parents`, `devices`) allow incremental feature expansion.

### 3.3 Security

- Password hashing with `bcrypt`.
- JWT auth with explicit role middleware.
- Request validation and rate limiting at entry points.
- CORS allow-list instead of wildcard trust.

### 3.4 Compatibility and Portability

- Browser-based delivery supports tablets and dedicated readers with webview support.
- No mandatory dependency on platform-specific SDKs.
- Works on low-to-mid resource profiles with optimized static frontend build.

## 4. Tradeoffs and Mitigations

Tradeoff | Impact | Mitigation
--- | --- | ---
In-memory rate limiter | Not shared across API replicas | Replace with Redis-backed limiter in production
Document DB schema flexibility | Risk of inconsistent content shape | Keep strict Zod validation and Mongoose constraints
Client-side rendering | Initial load and SEO tradeoffs | Acceptable for POC/device app context; add SSR only if needed
No binary asset pipeline yet | Media lifecycle is manual | Add object storage integration (S3/Cloudinary equivalent) next

## 5. Alternatives Considered

Alternative | Why not selected for current phase
--- | ---
Native tablet app first | Higher platform coupling and slower initial delivery
Relational DB first | Slower schema iteration for rapidly changing POC content structure
Monolithic full-stack framework | Less control over explicit API boundaries needed for hardware-agnostic integration

## 6. Future Evolution

The current stack can evolve without full rewrite:

- introduce Redis for distributed limits/caching
- add queue workers for media processing/audio generation
- split public reader APIs and back-office APIs into separate deployables if traffic diverges
- adopt object storage + CDN for production media assets

