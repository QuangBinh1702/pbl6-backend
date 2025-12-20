# Quick Start: PVCD Fix (5 Min Setup)

## 🎯 Problem
Student with 2 evidences: 10 + 20 = **20 (WRONG)** → Should be **30**

## ✅ Solution Implemented
- Evidence hook (new) calculates PVCD from faculty_point
- Old attendance hooks disabled (were causing conflict)
- Backfill script fixes all historical data

## 🚀 3 Steps to Deploy

### Step 1: Backup (1 min)
```bash
mongodump --uri="mongodb://YOUR_URI" --out=./backup
```

### Step 2: Backfill (2 min)
```bash
cd backend
node scripts/backfill_pvcd_from_evidence.js
```

**Expect**: "✅ Backfill completed successfully!"

### Step 3: Verify (1 min)
```bash
# Start server
npm run dev

# Test: Login as student, check "Điểm phục vụ cộng đồng"
# Should show 30 (not 20) ✅
```

## 📋 What Changed

✅ `evidence.model.js` - Added hook  
✅ `pvcd_record.model.js` - Disabled hook  
✅ `attendance.model.js` - Disabled hook  
✅ `backfill_pvcd_from_evidence.js` - New script

## ✨ Result

| Before | After |
|--------|-------|
| 10+20=20 ❌ | 10+20=30 ✅ |
| Wrong year | Correct year |
| Conflicting data | Single source of truth |

## 🔄 How It Works

```
Evidence saved (10 points, approved)
    ↓ Hook triggers
    ↓ Sums all approved for that year
    ↓ 10 + 20 = 30
    ↓ Updates PVCD
    ↓ Dashboard shows 30 ✅
```

## 📚 For More Details

- IMPLEMENTATION_GUIDE.md - Full how-to
- TEST_PVCD_FIX.md - Test scenarios
- IMPLEMENTATION_PLAN_PVCD_FIX.md - Root cause

## ✔️ Done!

Ready to deploy. Just 3 steps, ~5 minutes total.
