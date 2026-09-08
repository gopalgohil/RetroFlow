# RetroFlow

Full-Stack Web Application built with **Next.js** (Frontend) and **Node.js + Express + MongoDB Atlas** (Backend).

---

## 📁 Project Structure

```
Retro_Flow/
├── client/                 # Frontend (Next.js 16+ App Router, TypeScript, Tailwind CSS)
│   ├── src/
│   │   └── app/            # App Router pages & layouts
│   ├── package.json
│   └── ...
├── server/                 # Backend (Node.js, Express, Mongoose)
│   ├── config/
│   │   └── db.js           # MongoDB Atlas connection handler
│   ├── models/
│   │   └── Item.js         # Mongoose schema & model example
│   ├── routes/
│   │   └── api.js          # Express API routes (/api/health, /api/items)
│   ├── .env                # Backend environment configuration
│   ├── .env.example        # Environment variable template
│   ├── package.json
│   └── server.js           # Main Express server entrypoint
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend (Server) Setup

1. Open `server/.env` and update your MongoDB Atlas connection string:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   CLIENT_URL=http://localhost:3000
   ```

2. Start the backend development server:
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:5000`.

### 2. Frontend (Client) Setup

1. Start the Next.js development server:
   ```bash
   cd client
   npm run dev
   ```
   The client will run on `http://localhost:3000`.

---

## 🔗 Available Endpoints

- **Health Check**: `GET http://localhost:5000/api/health`
- **Items List**: `GET http://localhost:5000/api/items`
- **Create Item**: `POST http://localhost:5000/api/items`
# RetroFlow
