# HKids Hardware Integration Assumptions

Last updated: February 10, 2026

## 1. Goal

Define baseline assumptions so HKids can be deployed on tablets or dedicated reading devices without major redevelopment.

## 2. Device Profile Assumptions

Minimum target profile for acceptable UX:

- CPU: mid-range mobile SoC or better (4 logical cores recommended)
- RAM: 3 GB minimum (4 GB preferred)
- Storage: 1 GB free space for app shell and cached assets
- Display: 7-10 inches, minimum 1280x800
- Network: intermittent connectivity tolerated, stable connectivity preferred

## 3. Runtime Assumptions

Supported runtime model:

- modern Chromium-based browser or embedded webview
- JavaScript and local storage enabled
- HTTPS connectivity to API endpoint

Not assumed:

- platform-specific native SDKs
- constant high-bandwidth connection
- dedicated GPU features

## 4. Input and Accessibility Assumptions

- touch input is primary interaction mode
- large tap targets and simple navigation are required
- text and controls must remain usable for early readers with adult assistance when needed

## 5. Security and Operational Assumptions

- device access can be restricted to HKids app/shell in managed deployments
- API endpoints are reachable over TLS
- parent/admin credentials are never embedded in device firmware
- each reader device can provide a stable `deviceId` for pairing

## 6. Integration Scenarios

### 6.1 Managed Tablet Deployment

- HKids runs as browser app or kiosk webview.
- Device management tooling (MDM) controls app availability.
- Parent links device through pairing code flow.

### 6.2 Dedicated Reader Device

- Vendor wraps client build in a lightweight web container.
- Device provisioning injects API base URL and persistent device identifier.
- Reader usage limits are enforced server-side.

## 7. Current Constraints

Known constraints for this POC stage:

- no offline-first sync package yet
- no native TTS/audio pipeline in production flow
- rate limiting is in-memory at API instance level

## 8. Recommendations for Production Readiness

- implement offline cache and sync conflict strategy
- move global limits/session controls to shared infrastructure (Redis)
- use CDN/object storage for image delivery
- run device qualification tests on low-end tablets before rollout

