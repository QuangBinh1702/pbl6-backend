# 🚀 Quick Start Guide

## Setup (One Time)

```bash
cd backend

# 1. Install dependencies (if not done)
npm install

# 2. Configure environment
# Make sure .env has:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key

# 3. Import data (optional)
node import_json_data.js

# 4. Seed permission system (required)
node seed_new_permission_data.js

# 5. Test the system
node test_new_permission_system.js
```

## Run Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## Test Users (after seeding)

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | hashed_password_here | admin | Full access |
| student001 | hashed_password_here | student | Student + Class Monitor |
| teacher001 | hashed_password_here | khoa | Faculty role |

⚠️ **Note**: Update passwords in seed script for production!

## Key API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/profile` - Get profile

### Activities
- `GET /api/activities` - List (public)
- `POST /api/activities` - Create (auth required)
- `GET /api/activities/:id` - Details

### Registrations
- `GET /api/registrations/my-registrations` - My registrations
- `POST /api/registrations` - Register for activity

### Student Profiles
- `GET /api/student-profiles` - List all
- `GET /api/student-profiles/class-monitors` - Get class monitors

## Testing APIs

```bash
# Test all APIs
node test_api.js

# Or use curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

## Documentation

- **Permission System**: See `PERMISSION_SYSTEM.md`
- **Migration Guide**: See `MIGRATION_SUMMARY.md`
- **Full Details**: See `COMPLETION_SUMMARY.md`
- **API Endpoints**: See `API_ENDPOINTS.md`

## Common Issues

### 1. "MongoDB connection failed"
- Check MONGODB_URI in .env
- Verify MongoDB is running
- Check network/firewall

### 2. "Permission denied" (403)
- User doesn't have required permission
- Run seed script: `node seed_new_permission_data.js`
- Check user roles: GET `/api/users/:id/roles`

### 3. "Invalid credentials" (401)
- Wrong username/password
- User account locked (`isLocked: true`)
- User account inactive (`active: false`)

### 4. Import errors
- Check JSON file paths
- Verify file format (valid JSON)
- Check MongoDB connection

## Files Structure

```
backend/
├── src/
│   ├── controllers/      # Updated controllers
│   ├── models/           # Updated + new models
│   ├── routes/           # Updated routes with permissions
│   ├── middlewares/      # Permission middleware
│   └── utils/            # Permission utilities
├── seed_new_permission_data.js   # Seed permission system
├── import_json_data.js           # Import JSON data
├── test_api.js                   # Test APIs
└── COMPLETION_SUMMARY.md         # Full documentation
```

## Support

For detailed information, check:
1. `COMPLETION_SUMMARY.md` - Complete implementation details
2. `PERMISSION_SYSTEM.md` - Permission system guide
3. `API_ENDPOINTS.md` - All API endpoints

Happy coding! 🎉

