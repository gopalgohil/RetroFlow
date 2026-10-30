# 🚀 Digiflux (RetroFlow) - Quick DevOps Deployment Guide

A concise, step-by-step production deployment specification for DevOps engineers.

---

## 1. Tech Stack & Exact Versions

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js (LTS) | `v20.x` or `v22.x` | Base JavaScript runtime (`node:20-alpine`) |
| **Package Manager** | npm | `v10+` | Dependency management |
| **Frontend Framework** | Next.js (App Router) | `16.3.4` | SSR, Static optimization, Turbopack |
| **UI Library** | React | `19.2.8` | Component rendering |
| **Styling** | Tailwind CSS | `v4.x` | Modern utility styling |
| **Backend Framework** | Express (ES Modules) | `4.21.2` | REST API engine |
| **Real-Time Engine** | Socket.io | `4.8.3` | Live retrospectives, voting & timers |
| **Database** | MongoDB (Atlas) | `v6.0+` | Primary NoSQL document database |
| **ODM / Driver** | Mongoose | `8.9.5` | Schema validation & DB connection pooling |
| **Email Service** | Brevo (Sendinblue) | API v3 (`@getbrevo/brevo ^6.0.3`) | Transactional emails via HTTPS Port 443 |
| **Authentication** | JWT + bcryptjs | `jsonwebtoken 9.0.3`, `bcryptjs 3.0.3` | Bearer token auth & salted OTP hashing |
| **Third-Party OAuth** | Firebase Auth | `12.19.0` | Google 1-Click Authentication |

---

## 2. Ports & Network Architecture

- **Frontend:** Port `3000` (`http://localhost:3000`)
- **Backend API:** Port `5000` (`http://localhost:5000`)
- **WebSockets:** Port `5000` via path `/socket.io/`
- **Email Dispatch:** Outbound HTTPS on Port `443` (`api.brevo.com`)
- **SSL / TLS:** Required in production for secure cookies, WebSockets, and Google OAuth.

---

## 3. Environment Variables

### Backend (`server/.env`)
```ini
NODE_ENV=production
PORT=5000
CLIENT_URL=https://app.yourdomain.com
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/retroflow?retryWrites=true&w=majority
JWT_SECRET=super_strong_random_secret_minimum_32_characters
JWT_EXPIRES_IN=7d

# Brevo (Sendinblue) Transactional Emails
BREVO_API_KEY=xkeysib-your-brevo-api-key-here
BREVO_SENDER_EMAIL=notifications@yourdomain.com
BREVO_SENDER_NAME=Digiflux

# Admin who receives new user approval notifications
SUPER_ADMIN_EMAIL=admin@yourdomain.com
```

### Frontend (`client/.env.production` or CI/CD Build Args)
```ini
# Backend API Base URL
NEXT_PUBLIC_API_URL=https://app.yourdomain.com/api
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com

# Firebase Google Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDpHw7j9lBbHv4m8rgc0BuEwIiMFViu1nc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=retroflow-1d442.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=retroflow-1d442
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=retroflow-1d442.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=90825700119
NEXT_PUBLIC_FIREBASE_APP_ID=1:90825700119:web:8918ad2dcf4c5b06d6bd52
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-KFM52EY8VY
```

---

## 4. Build & Run Steps

### Step 1: Deploy Backend (`/server`)
```bash
cd server
npm ci --omit=dev
npm start
# Runs: node server.js on port 5000
```

### Step 2: Deploy Frontend (`/client`)
```bash
cd client
npm ci
npm run build
npm start
# Runs: next start on port 3000
```

---

## 5. Nginx Reverse Proxy Configuration (With WebSocket Support)

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    # 1. Frontend Next.js (Port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 2. Backend REST API (Port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Socket.io WebSockets (Port 5000) - Critical for Live Boards
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

## 6. Pre-Flight Checklist Before Going Live

1. **MongoDB Atlas Network Access:** Whitelist the production server's public IP address in MongoDB Atlas.
2. **Brevo Sender Verification:** Ensure `BREVO_SENDER_EMAIL` is verified in Brevo.
3. **Firebase Authorized Domain:** In Firebase Console &rarr; **Authentication** &rarr; **Settings** &rarr; **Authorized domains**, add your production domain (`app.yourdomain.com`).
4. **Health Check Probe:** Confirm server is running at `GET /api/health` (Returns `200 OK`).
