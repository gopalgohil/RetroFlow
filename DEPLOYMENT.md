# 🚀 Digiflux (RetroFlow) - Enterprise Deployment & DevOps Specification

This document provides complete technical requirements, architectural dependencies, environment variables, build/run instructions, and infrastructure recommendations for DevOps engineers deploying **Digiflux** into staging and production environments.

---

## 1. System Architecture Overview

Digiflux is built on a decoupled 2-tier client-server architecture with real-time WebSocket synchronization:

```
                          ┌──────────────────────────┐
                          │   Cloudflare / DNS / WAF │
                          └─────────────┬────────────┘
                                        │ (HTTPS / WSS - Port 443)
                          ┌─────────────▼────────────┐
                          │ Nginx / Reverse Proxy / ALB│
                          └──────┬────────────┬──────┘
             /api, /socket.io    │            │  Static & SSR (/*)
       ┌─────────────────────────┘            └─────────────────────────┐
       ▼                                                                ▼
┌──────────────────────────────┐                         ┌──────────────────────────────┐
│  Backend Service (Express)   │                         │  Frontend Service (Next.js)  │
│  - Node.js 20 LTS            │                         │  - Next.js 16 (App Router)   │
│  - Socket.io (WebSocket)     │                         │  - Turbopack / React 19      │
│  - REST API Engine           │                         │  - Internal Port: 3000       │
│  - Internal Port: 5000       │                         └──────────────────────────────┘
└──────┬───────────────┬───────┘
       │               │
       ▼               ▼
┌─────────────┐ ┌──────────────┐
│ MongoDB v6+ │ │ Brevo API    │
│ Atlas/Replica│ │ (Port 443)  │
└─────────────┘ └──────────────┘
```

- **Frontend:** Next.js 16 (App Router, Turbopack, React 19, TailwindCSS v4).
- **Backend:** Node.js (Express, ES Modules, Mongoose, Socket.io, Node-cron).
- **Database:** MongoDB 6.0+ (MongoDB Atlas or self-hosted Replica Set).
- **Real-Time Engine:** Socket.io (WebSocket with long-polling fallback) for live sprint retrospectives.
- **Third-Party Integrations:**
  - **Brevo (Sendinblue):** Transactional email dispatch (HTTPS REST API via port 443).
  - **Firebase Auth:** Google OAuth login (Client-side SDK).

---

## 2. Infrastructure & Runtime Requirements

| Component | Minimum Requirement | Recommended Production |
| :--- | :--- | :--- |
| **Node.js** | `v20.x LTS` | `v20.18.x LTS` (or `v22.x LTS`) |
| **Package Manager**| `npm v10+` | `npm v10+` |
| **Memory (Backend)**| 512 MB RAM | 1 GB - 2 GB RAM (scales with active Socket.io sessions) |
| **CPU (Backend)** | 0.5 vCPU | 1.0 - 2.0 vCPU |
| **Memory (Frontend)**| 512 MB RAM | 1 GB RAM |
| **Database** | MongoDB 6.0+ | MongoDB Atlas M10+ or 3-node Replica Set |
| **SSL / TLS** | Required | TLS 1.3 / Valid HTTPS certificate (mandatory for WebSockets & Google Auth) |
| **Ports** | `5000` (Backend), `3000` (Frontend) | Configurable via environment variables |

---

## 3. Environment Variables Reference

### 3.1 Backend Service (`server/.env`)

These variables must be provided to the backend container or process:

| Variable Name | Required | Default (if unset) | Description / DevOps Note |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Set to `production` in live environments. |
| `PORT` | No | `5000` | Port on which the Express HTTP server listens. |
| `CLIENT_URL` | **Yes** | `http://localhost:3000` | **Crucial:** Public URL of the frontend (e.g. `https://retroflow.yourcompany.com`). Multiple origins can be comma-separated. Used for CORS and email verification links. |
| `MONGODB_URI` | **Yes** | _None_ | MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/retroflow?retryWrites=true&w=majority`). |
| `JWT_SECRET` | **Yes** | _None_ | Cryptographic secret for signing JWT tokens. Minimum 16 characters (recommended: 64-byte hex string). |
| `JWT_EXPIRES_IN` | No | `7d` | Token validity duration (e.g. `7d`, `24h`, `30d`). |
| `BREVO_API_KEY` | **Yes** | _Simulation mode_ | Brevo (Sendinblue) transactional REST API Key (`xkeysib-...`). If missing, email falls back to server console simulation. |
| `BREVO_SENDER_EMAIL` | **Yes** | `gopalgohel249@gmail.com` | Verified sender email configured in your Brevo account. |
| `BREVO_SENDER_NAME` | No | `Digiflux` | Display name on outgoing transactional emails. |
| `SUPER_ADMIN_EMAIL` | **Yes** | `gopalgohel249@gmail.com` | Designated primary workspace super admin email. This address receives approval requests when new users register. |

---

### 3.2 Frontend Service (`client/.env.production` or build-time env)

> **⚠️ Important Next.js Note:** All `NEXT_PUBLIC_*` variables are baked into the client bundle at **build time** (`npm run build`). They must be set during the build stage (in CI/CD or Docker build arguments).

| Variable Name | Required | Default | Description / DevOps Note |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:5000/api` | Public base URL of backend API (e.g., `https://api.yourcompany.com/api` or `/api` if using a single domain reverse proxy). |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | No | `support@digiflux.io` | Support email displayed on dashboard and pending approval screens. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | **Yes** | Pre-configured | Firebase project Web API Key for Google Sign-in. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Yes** | Pre-configured | Firebase Auth domain (e.g. `retroflow-1d442.firebaseapp.com`). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **Yes** | Pre-configured | Firebase Project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | **Yes** | Pre-configured | Firebase Storage Bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | Pre-configured | Firebase Cloud Messaging Sender ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | **Yes** | Pre-configured | Firebase Web Application ID. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Optional | Firebase Analytics Measurement ID. |

---

## 4. What DevOps Engineers Can Customize / Change

DevOps engineers have full control over the following aspects:

1. **Hosting Topology:**
   - **Single-Domain Reverse Proxy (Recommended):** Host frontend at `https://app.domain.com` and proxy `/api/*` and `/socket.io/*` to the backend. Eliminates all CORS issues.
   - **Split-Domain Setup:** Frontend at `https://app.domain.com` and Backend at `https://api.domain.com`. Ensure `CLIENT_URL` on the backend matches the frontend domain.
2. **Containerization & Clustering:**
   - Docker / Docker Compose / Kubernetes / AWS ECS.
   - For multi-instance backend scaling with Socket.io, a Redis adapter (`@socket.io/redis-adapter`) can be attached if horizontal pod autoscaling is enabled.
3. **Database:**
   - Can point `MONGODB_URI` to any cloud provider (AWS DocumentDB with MongoDB compatibility, MongoDB Atlas, or self-hosted MongoDB clusters).
4. **Email & Domain Whitelisting:**
   - Set custom `BREVO_SENDER_EMAIL` and `BREVO_SENDER_NAME` matching company domain (e.g. `notifications@company.com`).
   - Configure DNS records (SPF, DKIM, DMARC) in Brevo for the company domain for 100% deliverability.
5. **Super Admin Assignment:**
   - Change `SUPER_ADMIN_EMAIL` to the designated company lead/admin.

---

## 5. Build & Execution Commands

### 5.1 Backend Service (`/server`)

```bash
# Navigate to server directory
cd server

# 1. Install production dependencies
npm ci --omit=dev

# 2. Run backend service
npm start
# -> Runs: node server.js on port 5000 (or PORT env)
```

### 5.2 Frontend Service (`/client`)

```bash
# Navigate to client directory
cd client

# 1. Install dependencies
npm ci

# 2. Compile optimized production build (bakes in NEXT_PUBLIC_* variables)
npm run build

# 3. Start Next.js production server
npm start
# -> Runs: next start on port 3000 (or PORT env)
```

---

## 6. Docker Deployment Reference

### 6.1 Backend Dockerfile (`server/Dockerfile`)

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000
USER node
CMD ["node", "server.js"]
```

### 6.2 Frontend Dockerfile (`client/Dockerfile`)

```dockerfile
# Step 1: Dependencies & Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time arguments for client environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

RUN npm run build

# Step 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
USER node
CMD ["npm", "start"]
```

### 6.3 Docker Compose Reference (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - CLIENT_URL=https://app.yourdomain.com
      - MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/retroflow?retryWrites=true&w=majority
      - JWT_SECRET=your_super_strong_64_char_production_jwt_secret
      - JWT_EXPIRES_IN=7d
      - BREVO_API_KEY=xkeysib-your-key-here
      - BREVO_SENDER_EMAIL=notifications@yourdomain.com
      - BREVO_SENDER_NAME=Digiflux
      - SUPER_ADMIN_EMAIL=admin@yourdomain.com

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
        - NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

---

## 7. Reverse Proxy & Nginx Configuration (WebSocket Enabled)

Because Digiflux uses **Socket.io** for real-time card moving, voting, and timers, the reverse proxy **MUST** support WebSocket upgrades:

```nginx
# Nginx Configuration Example
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    # 1. Frontend Next.js Application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 2. Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Socket.io Real-Time WebSocket Engine (CRITICAL)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 8. Health Checks & Monitoring

The backend exposes a health endpoint for container orchestrators (Kubernetes Liveness/Readiness probes, AWS Route53, or Docker healthchecks):

- **Health Endpoint:** `GET /api/health`
- **Expected Status Code:** `200 OK`
- **Root Service Status:** `GET /` &rarr; Returns service metadata & version.
- **Sample Docker Healthcheck:**
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1
  ```

---

## 9. Third-Party Configuration Checklist

Before going live in production, DevOps / Admin must verify:

1. **Firebase Authorized Domains (for Google Sign-In):**
   - Open Firebase Console &rarr; **Authentication** &rarr; **Settings** &rarr; **Authorized domains**.
   - Add your production domain (e.g. `app.yourdomain.com`).
2. **Brevo Account Verification:**
   - Verify that the `BREVO_SENDER_EMAIL` is verified in Brevo.
   - Add DNS SPF and DKIM records for maximum email deliverability to corporate inboxes.
3. **MongoDB Atlas IP Access List:**
   - Add production server / NAT Gateway IP address to the MongoDB Atlas Network Access whitelist.
