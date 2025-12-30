# Testing Guide: Red Alert Widget & Image Analysis

## Prerequisites Checklist

Before testing, ensure:
- [ ] Database migration completed (`ai_triage_logs` table exists)
- [ ] Backend server running (`npm run server`)
- [ ] Frontend dev server running (`npm run dev`)
- [ ] Azure OpenAI credentials configured in `.env`
- [ ] Logged in as Admin/Doctor user

---

## Feature 1: Red Alert Widget Testing

### Step 1: Verify Widget is Visible
1. Navigate to Admin Dashboard: `http://localhost:5173/staff-dashboard`
2. Check browser console (F12) for any errors
3. The widget should be invisible initially (no alerts)

### Step 2: Create a Test Emergency Alert

**Option A: Using Browser Console**
```javascript
// Open browser console (F12) and run:
fetch('http://localhost:8080/api/ems/alerts/manual', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scene_location_lat: 12.9716,
    scene_location_lon: 77.5946,
    patient_name: "Test Patient - Critical Trauma",
    notes: "Vehicle accident with visible injuries"
  })
})
.then(r => r.json())
.then(console.log);
```

**Option B: Using curl (Terminal)**
```bash
curl -X POST http://localhost:8080/api/ems/live-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "scene_location_lat": 12.9716,
    "scene_location_lon": 77.5946,
    "patient_name": "Test Patient",
    "notes": "Test accident"
  }'
```

**Option C: Using Postman**
- Method: `POST`
- URL: `http://localhost:8080/api/ems/alerts/manual`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "scene_location_lat": 12.9716,
  "scene_location_lon": 77.5946,
  "patient_name": "John Doe - Critical Case",
  "notes": "High-speed collision, multiple injuries suspected"
}
```

### Step 3: Verify Widget Appears
1. **Wait 2 seconds** (widget polls every 2 seconds)
2. **Red Alert Banner** should appear at top of dashboard
3. **Check Display:**
   - ✅ Red background (bg-red-700)
   - ✅ "CRITICAL TRAUMA ALERT" text
   - ✅ Patient name displayed
   - ✅ Pulsing animation on border
   - ✅ "View Patient Details" button
   - ✅ "Dismiss" button (X icon)

### Step 4: Test Widget Functionality
1. **Click "Dismiss"** → Widget should disappear
2. **Click "View Patient Details"** → Should navigate to fleet management
3. **Create another alert** → Widget should reappear

### Step 5: Verify API Endpoint Directly
```bash
# Check if alerts are being returned
curl http://localhost:8080/api/ems/live-alerts
```

Expected Response:
```json
{
  "success": true,
  "alerts": [
    {
      "trip_id": "ER-...",
      "patient_name": "Test Patient",
      "eta_minutes": null,
      "alert_timestamp": "2025-01-XX...",
      "ai_notes": null,
      "recommended_specialist": null
    }
  ]
}
```

---

## Feature 2: Image Analysis Testing

### Step 1: Prepare Test Image
- Use any crash/accident image (jpg, png)
- Or download a sample from: https://unsplash.com/s/photos/car-accident
- Save it locally (e.g., `test-crash.jpg`)

### Step 2: Test Image Upload

**Option A: Using curl (Terminal)**
```bash
curl -X POST http://localhost:8080/api/ems/analyze-photo \
  -F "crash_image=@/path/to/your/test-crash.jpg" \
  -F "trip_id=ER-1234567890-12345"
```

**Option B: Using Postman**
1. Method: `POST`
2. URL: `http://localhost:8080/api/ems/analyze-photo`
3. Body: `form-data`
   - Key: `crash_image` (Type: File) → Select your image
   - Key: `trip_id` (Type: Text, Optional) → `ER-TEST-123`

**Option C: Using Browser Console (with File Input)**
```javascript
// Create a file input in browser console
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';
input.onchange = async (e) => {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append('crash_image', file);
  formData.append('trip_id', 'ER-TEST-' + Date.now());
  
  const res = await fetch('http://localhost:8080/api/ems/analyze-photo', {
    method: 'POST',
    body: formData
  });
  console.log(await res.json());
};
input.click();
```

### Step 3: Verify Response
Expected Response:
```json
{
  "success": true,
  "analysis": {
    "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "injury_risk": "High" | "Medium" | "Low",
    "notes": "Detailed AI analysis of visible injuries...",
    "recommended_specialist": "Trauma Surgeon" | "Orthopedic Surgeon" | etc.
  },
  "trip_id": "ER-TEST-123"
}
```

### Step 4: Verify Database Entry
Check if analysis was saved to `ai_triage_logs` table:
```sql
SELECT * FROM ai_triage_logs ORDER BY analysis_timestamp DESC LIMIT 1;
```

### Step 5: Test Widget with AI Data
1. **Create alert** with the same `trip_id` used in image analysis
2. **Wait 2 seconds**
3. **Widget should show:**
   - ✅ AI notes in "Injury Prediction" field
   - ✅ Specialist name in "Specialist Paged" field
   - ✅ More detailed information

---

## Feature 3: End-to-End Workflow Test

### Complete Scenario:
1. **Create Emergency Alert**
   ```bash
   POST /api/ems/alerts/manual
   {
     "scene_location_lat": 12.9716,
     "scene_location_lon": 77.5946,
     "patient_name": "Jane Smith",
     "notes": "Motorcycle accident"
   }
   ```
   → Note the `trip_id` from response

2. **Upload Crash Image**
   ```bash
   POST /api/ems/analyze-photo
   Form-data:
     crash_image: [upload image]
     trip_id: [use trip_id from step 1]
   ```

3. **Verify Widget Shows AI Data**
   - Refresh dashboard
   - Widget should display AI analysis
   - Check "Injury Prediction" and "Specialist Paged"

4. **Check Database**
   ```sql
   SELECT 
     et.trip_id,
     et.patient_name,
     atl.ai_notes,
     atl.recommended_specialist,
     atl.severity
   FROM emergencytrips et
   LEFT JOIN ai_triage_logs atl ON et.trip_id = atl.trip_id
   WHERE et.trip_id = 'YOUR_TRIP_ID';
   ```

---

## Troubleshooting Checklist

### Widget Not Appearing?
- [ ] Check browser console for errors (F12)
- [ ] Verify `/api/ems/live-alerts` returns data
- [ ] Check network tab for polling requests (every 2 seconds)
- [ ] Ensure alert status is `New_Alert`, `Assigned`, or `En_Route_To_Scene`

### Image Analysis Failing?
- [ ] Check server logs for Azure OpenAI errors
- [ ] Verify `.env` has correct Azure credentials
- [ ] Check image file size (should be reasonable, < 10MB)
- [ ] Verify image format (jpg, png supported)
- [ ] Check if `ai_triage_logs` table exists

### API Errors?
- [ ] Verify backend server is running (`npm run server`)
- [ ] Check CORS settings in `server/index.cjs`
- [ ] Verify route is registered: `/api/ems/live-alerts` and `/api/ems/analyze-photo`
- [ ] Check database connection in `.env`

### Database Issues?
- [ ] Run migration: `node server/migrations/run_ai_triage_migration.cjs`
- [ ] Verify table exists: `SHOW TABLES LIKE 'ai_triage_logs';`
- [ ] Check table structure: `DESCRIBE ai_triage_logs;`

---

## Quick Test Commands

### Test Live Alerts Endpoint
```bash
# Get current alerts
curl http://localhost:8080/api/ems/live-alerts

# Create test alert
curl -X POST http://localhost:8080/api/ems/alerts/manual \
  -H "Content-Type: application/json" \
  -d '{"scene_location_lat":12.9716,"scene_location_lon":77.5946,"patient_name":"Test","notes":"Test"}'
```

### Test Image Analysis
```bash
# Replace with your image path
curl -X POST http://localhost:8080/api/ems/analyze-photo \
  -F "crash_image=@./test-image.jpg" \
  -F "trip_id=ER-TEST-123"
```

### Check Database
```sql
-- Check if table exists
SHOW TABLES LIKE 'ai_triage_logs';

-- View recent analyses
SELECT * FROM ai_triage_logs ORDER BY analysis_timestamp DESC LIMIT 5;

-- Check alerts with AI data
SELECT et.*, atl.ai_notes, atl.recommended_specialist 
FROM emergencytrips et 
LEFT JOIN ai_triage_logs atl ON et.trip_id = atl.trip_id 
WHERE et.status IN ('New_Alert', 'Assigned', 'En_Route_To_Scene');
```

---

## Success Criteria

✅ **Red Alert Widget:**
- Appears when emergency alert exists
- Polls every 2 seconds
- Shows patient info, ETA, AI notes, specialist
- Dismiss button works
- View Details button navigates correctly

✅ **Image Analysis:**
- Accepts image upload
- Returns AI analysis JSON
- Saves to database
- Links to emergency trip via trip_id

✅ **Integration:**
- Widget displays AI analysis data
- Database relationships work correctly
- No console errors
- Smooth user experience

---

## Next Steps After Testing

1. **Add Authentication** - Protect endpoints
2. **Add Error Handling** - Better user feedback
3. **Add Loading States** - Show processing status
4. **Add Image Preview** - Show uploaded image
5. **Add Notifications** - Alert admins of critical cases

