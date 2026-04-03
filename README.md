# MeetMind Enterprise — Meeting Intelligence Platform

A production-grade full-stack meeting management platform with JWT authentication, role-based access control, real-time voice recording, analytics dashboards, and enterprise-level security.

---

## ✨ What's New in v2.0 (Enterprise Edition)

### Backend
| Feature | Details |
|---|---|
| **JWT Authentication** | Register / Login / Refresh with bcrypt password hashing |
| **Role-Based Access** | Admin / Manager / Member roles with route-level guards |
| **Security Hardening** | Helmet HTTP headers, CORS, mongo-sanitize (NoSQL injection), compression |
| **Rate Limiting** | 100 req/15min globally · 20 req/15min on auth endpoints |
| **Input Validation** | express-validator on every mutating route |
| **Global Error Handler** | AppError class, asyncHandler wrapper, Mongoose error mapping |
| **Structured Logging** | Winston — console + rotating log files in `/logs` |
| **Soft Delete** | All data is soft-deleted (never permanently lost) |
| **Audit Trail** | `createdBy`, `updatedBy`, `deletedBy` on all models |
| **DB Indexes** | Compound indexes + MongoDB full-text search |
| **Pagination** | All list endpoints support `?page=&limit=&sortBy=&sortOrder=` |
| **Graceful Shutdown** | SIGTERM/SIGINT handled — drains connections cleanly |

### Frontend
| Feature | Details |
|---|---|
| **Auth Context** | JWT stored in localStorage, axios interceptor auto-attaches token |
| **Auto-Logout** | 401 response anywhere → redirect to /login |
| **Protected Routes** | `<ProtectedRoute>` + `<GuestRoute>` wrappers |
| **Toast Notifications** | Global success/error/warning/info toasts (top-right) |
| **Skeleton Loaders** | Shimmer placeholders for all loading states |
| **Analytics Charts** | Recharts — meetings by status (pie), notes by priority (bar), action item rate |
| **Pin Notes** | Pin important notes to the top of any meeting |
| **Search & Filter** | Full-text search + status/priority filters on all list pages |
| **Pagination** | Client-side pagination on meetings list |
| **Profile Page** | Edit name/department + change password in-app |
| **Admin Panel** | User management, role assignment, activate/deactivate users |
| **User Avatar** | Auto-generated initials avatar with consistent color hashing |

---

## 🗂️ Project Structure

```
meeting-dashboard/
├── backend/
│   ├── middleware/
│   │   ├── auth.js           # JWT protect/restrictTo
│   │   ├── errorHandler.js   # AppError + asyncHandler
│   │   └── validators.js     # express-validator rules
│   ├── models/
│   │   ├── User.js           # Auth + roles
│   │   ├── Meeting.js        # Soft delete, text index, audit
│   │   ├── Note.js           # Pin, edit history, action items
│   │   └── Recording.js      # Audio file metadata
│   ├── routes/
│   │   ├── auth.js           # Register/login/me/change-password
│   │   ├── meetings.js       # CRUD + stats + pagination
│   │   ├── notes.js          # CRUD + pin + action item toggle
│   │   ├── recordings.js     # Upload/delete/update
│   │   └── admin.js          # User management (admin only)
│   ├── utils/
│   │   ├── apiResponse.js    # Consistent response shape
│   │   └── logger.js         # Winston structured logger
│   ├── logs/                 # Auto-created log files
│   ├── uploads/              # Audio file storage
│   ├── server.js             # Express app entry point
│   ├── .env                  # Environment config
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx   # JWT + axios interceptors
    │   │   └── ToastContext.jsx  # Global notifications
    │   ├── components/
    │   │   ├── Sidebar.jsx           # Nav + user panel + logout
    │   │   ├── NoteCard.jsx          # Pin, edit, delete
    │   │   ├── CreateNoteModal.jsx   # Note creation form
    │   │   ├── VoiceRecorder.jsx     # Audio recording
    │   │   ├── Skeleton.jsx          # Loading shimmer
    │   │   └── ProtectedRoute.jsx    # Auth guards
    │   ├── pages/
    │   │   ├── Login.jsx         # Sign in
    │   │   ├── Register.jsx      # Create account
    │   │   ├── Dashboard.jsx     # Analytics + recent meetings
    │   │   ├── Meetings.jsx      # List with search/filter/pagination
    │   │   ├── MeetingDetail.jsx # Notes + Recorder + Recordings
    │   │   ├── AllNotes.jsx      # Cross-meeting notes
    │   │   ├── AllRecordings.jsx # All audio playback
    │   │   ├── Profile.jsx       # Edit profile + change password
    │   │   └── AdminUsers.jsx    # User management (admin)
    │   ├── utils/api.js      # Auth'd axios API calls
    │   └── App.js            # Routing with auth guards
    └── package.json
```

---

## 🚀 Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally (or Atlas URI)

### 1. Backend
```bash
cd meeting-dashboard/backend
npm install
# Edit .env — set JWT_SECRET to a random 32+ char string
npm run dev
# → http://localhost:5000
```

### 2. Frontend
```bash
cd meeting-dashboard/frontend
npm install
npm start
# → http://localhost:3000
```

### 3. Create your first account
Open http://localhost:3000 → you'll be redirected to /register → fill in the form → your first user is automatically created as **member** role.

**To make yourself an admin**, open MongoDB shell:
```js
use meetmind_enterprise
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
Then re-login — you'll see the Admin section in the sidebar.

---

## 🔐 API Reference (v2)

All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login → returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| PATCH | `/api/auth/me` | Yes | Update name/department |
| PATCH | `/api/auth/change-password` | Yes | Change password |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings?page=1&limit=12&status=ongoing&search=q1` | Paginated list |
| GET | `/api/meetings/stats/overview` | Dashboard analytics |
| GET | `/api/meetings/:id` | Meeting + notes + recordings |
| POST | `/api/meetings` | Create |
| PATCH | `/api/meetings/:id` | Update |
| DELETE | `/api/meetings/:id` | Soft delete |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes/meeting/:id?priority=high&search=budget` | Meeting notes |
| POST | `/api/notes` | Create note |
| PATCH | `/api/notes/:id` | Update (saves edit history) |
| PATCH | `/api/notes/:id/pin` | Toggle pin |
| PATCH | `/api/notes/:id/action-items/:itemId` | Toggle action item |
| DELETE | `/api/notes/:id` | Soft delete |

### Recordings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recordings/meeting/:id` | Meeting recordings |
| POST | `/api/recordings/upload` | Upload audio (multipart) |
| PATCH | `/api/recordings/:id` | Update label/description |
| DELETE | `/api/recordings/:id` | Delete + remove file |

### Admin (admin role only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | All users with search/role filter |
| PATCH | `/api/admin/users/:id` | Update role/isActive/department |
| DELETE | `/api/admin/users/:id` | Deactivate user |

---

## ⚙️ Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/meetmind_enterprise

# JWT — change this in production!
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE_MB=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

For production, also set `NODE_ENV=production` and use a real MongoDB Atlas URI.

---

## 🔒 Security Checklist (production)

- [ ] Change `JWT_SECRET` to a cryptographically random 64-char string
- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Put behind HTTPS (nginx / Cloudflare)
- [ ] Set `ALLOWED_ORIGINS` to your actual domain
- [ ] Store `.env` outside version control
- [ ] Enable MongoDB authentication
