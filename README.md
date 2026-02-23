<<<<<<< HEAD
# CRM-Sales-Management-System
=======
# CRM & Sales Management System 🚀

A production-ready CRM & Sales Management System built with **Node.js + Express + MongoDB + React**.

## 📁 Project Structure

```
CRM & Sales Management System/
├── backend/          # Express API server
│   ├── config/       # DB connection
│   ├── controllers/  # Route logic
│   ├── middleware/   # Auth, validation, error handler
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API route definitions
│   ├── utils/        # JWT, email, seeder helpers
│   ├── .env          # Environment variables (DO NOT COMMIT)
│   └── server.js     # App entry point
└── frontend/         # React + Vite SPA
    └── src/
        ├── context/  # Auth context
        ├── pages/    # All pages
        ├── services/ # Axios API layer
        └── utils/    # Helper functions
```

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
# Edit .env with your MongoDB URI and email credentials
npm run seed       # Seed admin user
npm run dev        # Start dev server on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev        # Start on port 3000
```

### 3. Login

- **Admin**: admin@crm.com / Admin@123456
- **Sales**: Create via Admin → User Management

## 🔐 Security Features

- ✅ bcrypt (12 rounds) password hashing
- ✅ JWT access (15m) + refresh (7d) tokens
- ✅ RBAC (admin / sales)
- ✅ Helmet secure headers
- ✅ CORS allowlist
- ✅ Rate limiting (auth routes)
- ✅ NoSQL injection prevention (mongo-sanitize)
- ✅ express-validator input validation
- ✅ Password reset via email token (hashed)
- ✅ Email verification
- ✅ Deactivated user blocking

## 🚀 Deployment

### Backend → Render

1. Create new Web Service on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set `Build Command`: `npm install`
4. Set `Start Command`: `node server.js`
5. Add all environment variables from `.env`

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set `VITE_API_URL` env var to your Render backend URL
4. Update `vite.config.js` proxy target to match

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| POST | /api/auth/forgot-password | Public | Send reset email |
| POST | /api/auth/reset-password/:token | Public | Reset password |
| GET | /api/auth/me | JWT | Get profile |
| GET | /api/leads | JWT | List leads |
| POST | /api/leads | JWT | Create lead |
| PUT | /api/leads/:id | JWT | Update lead |
| DELETE | /api/leads/:id | Admin | Archive lead |
| GET | /api/deals | JWT | List deals |
| POST | /api/deals | JWT | Create deal |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | List users |
| GET | /api/admin/analytics | Admin | Analytics data |
>>>>>>> 4aead61 (Initial project setup)
