# AGENTS.md - Development Guidelines

## Build & Test Commands

**Backend (Node.js/Express):**
- `cd backend && npm install` - Install dependencies
- `npm start` - Run production server
- `npm run dev` - Run with nodemon for development
- No test framework configured; manual testing via Postman

**Frontend (React):**
- `cd frontend && npm install` - Install dependencies
- `npm start` - Dev server at localhost:3000
- `npm run build` - Production build
- `npm test` - Run tests (React testing, single test: `npm test -- --testNamePattern="test name"`)

## Architecture & Structure

**Backend:** Express.js + MongoDB (Mongoose)
- `src/config/` - Database connections
- `src/models/` - Mongoose schemas (User, Activity, Registration, Attendance, etc.)
- `src/controllers/` - Business logic for routes
- `src/routes/` - API endpoints (auth, users, activities, attendance, feedback, chatbot, etc.)
- `src/middlewares/` - Auth, error handling, DB connection, multer uploads
- `src/utils/` - Helper functions
- Core APIs: Auth/JWT, Activity management, Attendance QR codes, Evidence upload (Cloudinary), Chatbot integration

**Frontend:** React (functional components)
- `src/components/` - Reusable UI components
- `src/pages/` - Page containers
- `src/styles/` - CSS modules

**Database:** MongoDB with collections for Users, Activities, Registrations, Attendances, Posts, Evidence, Feedback

## Code Style

- **Language:** JavaScript (Node.js backend, React frontend)
- **Imports:** CommonJS (`require()`) for backend; ES6 imports in frontend
- **Naming:** camelCase for variables/functions; PascalCase for classes/models
- **Error Handling:** Try-catch blocks; centralized error middleware returning JSON with status/message/error
- **Response Format:** `{ status, message, data, error }` or `{ success, data }`
- **HTTP Status:** 200 (success), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- **Auth:** JWT tokens in Authorization header; Permission-based access control
- **Code Comments:** Vietnamese comments in some files; keep consistent

## rule# File Creation

- Do NOT create .md files unless explicitly requested by the user
- Only create documentation files when the user specifically asks for them