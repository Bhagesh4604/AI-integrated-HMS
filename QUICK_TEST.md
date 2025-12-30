# Quick Test Steps - Red Alert Widget & Image Analysis

## 🚀 Fast Testing (5 minutes)

### Step 1: Start Servers
```bash
# Terminal 1
npm run server

# Terminal 2  
npm run dev
```

### Step 2: Create Test Alert
Open browser console (F12) and run:
```javascript
fetch('http://localhost:8080/api/ems/alerts/manual', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    scene_location_lat: 12.9716,
    scene_location_lon: 77.5946,
    patient_name: "Test Patient",
    notes: "Critical accident"
  })
}).then(r => r.json()).then(console.log);
```

### Step 3: Check Widget
1. Go to: `http://localhost:5173/staff-dashboard`
2. Wait 2 seconds
3. ✅ Red alert banner should appear at top

### Step 4: Test Image Analysis
In browser console:
```javascript
// Create file input
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.onchange = async (e) => {
  const formData = new FormData();
  formData.append('crash_image', e.target.files[0]);
  formData.append('trip_id', 'ER-TEST-123');
  
  const res = await fetch('http://localhost:8080/api/ems/analyze-photo', {
    method: 'POST',
    body: formData
  });
  console.log('AI Analysis:', await res.json());
};
input.click();
```

### Step 5: Verify Results
- ✅ Widget shows alert
- ✅ Image analysis returns JSON
- ✅ No console errors

---

## 🔍 Detailed Status Check

### Check 1: Database Table Exists
```sql
SHOW TABLES LIKE 'ai_triage_logs';
```
Should return: `ai_triage_logs`

### Check 2: API Endpoints Work
```bash
# Test live-alerts
curl http://localhost:8080/api/ems/live-alerts

# Should return: {"success":true,"alerts":[...]}
```

### Check 3: Widget Polling
1. Open browser DevTools → Network tab
2. Filter: `live-alerts`
3. Should see requests every 2 seconds

### Check 4: Component Loaded
1. Open DevTools → Console
2. No errors about `EmergencyAlertWidget`
3. Check React DevTools → Component tree shows `EmergencyAlertWidget`

---

## ⚠️ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Widget not appearing | Check `/api/ems/live-alerts` returns data |
| Image upload fails | Verify Azure OpenAI credentials in `.env` |
| Database error | Run migration: `node server/migrations/run_ai_triage_migration.cjs` |
| CORS error | Check `server/index.cjs` CORS settings |
| Icon error | Already fixed - refresh browser |

---

## ✅ Success Indicators

- [ ] Red alert banner appears on dashboard
- [ ] Widget polls every 2 seconds (check Network tab)
- [ ] Image analysis returns JSON response
- [ ] Database saves AI analysis
- [ ] Widget shows AI notes when available
- [ ] No console errors
- [ ] Dismiss button works
- [ ] View Details button navigates

---

## 📝 Test Checklist

Run through this checklist:

1. **Database Setup**
   - [ ] `ai_triage_logs` table exists
   - [ ] Migration completed successfully

2. **Backend**
   - [ ] Server starts without errors
   - [ ] Routes registered: `/api/ems/live-alerts`, `/api/ems/analyze-photo`
   - [ ] Azure OpenAI credentials configured

3. **Frontend**
   - [ ] Widget component loads
   - [ ] No import errors
   - [ ] Dashboard displays correctly

4. **Functionality**
   - [ ] Alert creation works
   - [ ] Widget displays alerts
   - [ ] Image upload works
   - [ ] AI analysis returns data
   - [ ] Database saves correctly

5. **Integration**
   - [ ] Widget shows AI data
   - [ ] End-to-end workflow works
   - [ ] No errors in console

---

## 🎯 Expected Behavior

### Red Alert Widget:
- **Invisible** when no alerts
- **Visible** when alert exists (red banner, pulsing border)
- **Updates** every 2 seconds automatically
- **Shows**: Patient name, ETA, AI notes, Specialist
- **Actions**: Dismiss (hides), View Details (navigates)

### Image Analysis:
- **Accepts**: Image file (jpg, png)
- **Returns**: JSON with severity, injury_risk, notes, specialist
- **Saves**: To `ai_triage_logs` table
- **Links**: Via `trip_id` to emergency trip

---

**Need Help?** Check `TESTING_GUIDE.md` for detailed instructions.

