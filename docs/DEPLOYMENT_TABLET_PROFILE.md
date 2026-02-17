# Tablet Deployment Profile

Last updated: February 10, 2026

This profile is a concrete deployment target for tablet or dedicated reading device rollouts.

## 1. What This Profile Deploys

- `web`: static HKids client served by Nginx
- `api`: Node.js backend API
- `mongo`: MongoDB database
- `seed` (optional profile): populates initial data and admin account

Deployment file:

- `deploy/docker-compose.tablet.yml`

## 2. Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Device and operator network reachability to the host machine

## 3. First-Time Setup

1. Create environment file:

```powershell
Copy-Item deploy/.env.example deploy/.env
```

2. Edit `deploy/.env` and set a strong `JWT_SECRET`.

3. Build and start services:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.tablet.yml up -d --build
```

4. (Optional) Seed data:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.tablet.yml --profile seed run --rm seed
```

## 4. Access URLs

- Reader + back-office UI: `http://<host-ip>:8080`
- API (through same origin proxy): `http://<host-ip>:8080/api/...`
- Health endpoint: `http://<host-ip>:8080/health`

Use the host LAN IP (not `localhost`) for physical tablets on the same network.

## 5. Admin Access After Seed

Default seeded credentials:

- Email: `admin@hkids.com`
- Password: `admin123`

Change credentials immediately after first login in shared environments.

## 6. Tablet/Dedicated Device Setup

Recommended rollout mode:

- lock the device into kiosk mode
- launch browser/webview at `http://<host-ip>:8080`
- disable navigation to external URLs/apps

Pairing flow on device:

1. Parent signs in through parent APIs/client.
2. Parent creates a pairing code.
3. Device claims code via public pairing endpoint.
4. Reader usage and lockouts are enforced server-side.

## 7. Operations

Start stack:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.tablet.yml up -d
```

Stop stack:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.tablet.yml down
```

Stop and remove data volume:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.tablet.yml down -v
```

Tail logs:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.tablet.yml logs -f web api mongo
```

## 8. Update Procedure

1. Pull latest code to deployment host.
2. Rebuild and restart:

```powershell
docker compose --env-file deploy/.env -f deploy/docker-compose.tablet.yml up -d --build
```

3. Validate:
- `http://<host-ip>:8080/health`
- login and content read flow
- pairing + daily limit flow

## 9. CI Pipeline

Automated checks are defined in:

- `.github/workflows/ci.yml`

CI currently validates:

- client install + build
- server install + build
- Docker image build for `client` and `server`

## 10. Production Hardening Checklist

- move rate limiting/shared counters to Redis
- terminate TLS at ingress/load balancer
- externalize media assets to object storage + CDN
- add backups and alerting for MongoDB
- enforce secret rotation policy for JWT key material

