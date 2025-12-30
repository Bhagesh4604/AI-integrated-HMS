# Red Alert Widget & Image Analysis Setup Instructions

## Step 1: Create the Database Table

You need to create the `ai_triage_logs` table in your MySQL database. Choose one method:

### Option A: Run the Migration Script (Recommended)
```bash
node server/migrations/run_ai_triage_migration.cjs
```

### Option B: Run SQL Manually
Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line) and execute:
```sql
-- Copy and paste the contents of server/migrations/create_ai_triage_logs_table.sql
CREATE TABLE IF NOT EXISTS `ai_triage_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trip_id` varchar(50) NOT NULL,
  `ai_notes` text DEFAULT NULL,
  `recommended_specialist` varchar(255) DEFAULT NULL,
  `severity` enum('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
  `injury_risk` enum('High', 'Medium', 'Low') DEFAULT 'Medium',
  `analysis_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trip_id` (`trip_id`),
  KEY `idx_analysis_timestamp` (`analysis_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Step 2: Verify Environment Variables

Make sure your `.env` file has Azure OpenAI credentials:
```env
AZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT_ID=gpt-4o
```

## Step 3: Start Your Server

```bash
npm run server
```

The server should start on port 8080. Verify the routes are registered:
- ✅ `GET /api/ems/live-alerts` - For the Red Alert Widget
- ✅ `POST /api/ems/analyze-photo` - For crash image analysis

## Step 4: Start the Frontend

In a new terminal:
```bash
npm run dev
```

## Step 5: Test the Features

### Test 1: Red Alert Widget
1. Go to your Admin Dashboard (`/staff-dashboard`)
2. The `EmergencyAlertWidget` is already integrated and will appear automatically
3. To see it in action, create a test emergency alert:
   ```bash
   # Using curl or Postman
   POST http://localhost:8080/api/ems/alerts/manual
   Body (JSON):
   {
     "scene_location_lat": 12.9716,
     "scene_location_lon": 77.5946,
     "patient_name": "Test Patient",
     "notes": "Test accident alert"
   }
   ```
4. The red alert banner should appear at the top of the dashboard

### Test 2: Image Analysis Endpoint
```bash
# Using curl
curl -X POST http://localhost:8080/api/ems/analyze-photo \
  -F "crash_image=@/path/to/your/crash/image.jpg" \
  -F "trip_id=ER-1234567890-12345"

# Or using Postman:
# Method: POST
# URL: http://localhost:8080/api/ems/analyze-photo
# Body: form-data
#   - Key: crash_image (Type: File)
#   - Key: trip_id (Type: Text, Optional)
```

Expected Response:
```json
{
  "success": true,
  "analysis": {
    "severity": "CRITICAL",
    "injury_risk": "High",
    "notes": "Visible blood, significant vehicle damage...",
    "recommended_specialist": "Trauma Surgeon"
  },
  "trip_id": "ER-1234567890-12345"
}
```

## Step 6: Verify Integration

1. **Dashboard Integration**: The `EmergencyAlertWidget` is already added to `Dashboard.tsx`
2. **Polling**: The widget polls every 2 seconds for new alerts
3. **Display**: When an alert with AI triage data exists, the red banner appears

## Troubleshooting

### Widget Not Appearing?
- Check browser console for errors
- Verify the `/api/ems/live-alerts` endpoint returns data:
  ```bash
  curl http://localhost:8080/api/ems/live-alerts
  ```

### Image Analysis Failing?
- Verify Azure OpenAI credentials in `.env`
- Check server logs for error messages
- Ensure the image file is a valid image format (jpg, png, etc.)

### Database Errors?
- Verify the `ai_triage_logs` table was created
- Check database connection in `.env`
- Ensure `trip_id` format matches your `emergencytrips` table

## Next Steps for Production

1. **Add Authentication**: Protect the `/analyze-photo` endpoint with admin authentication
2. **Add Rate Limiting**: Prevent abuse of the image analysis endpoint
3. **Add Image Validation**: Validate image size and format before processing
4. **Add Logging**: Log all AI analyses for audit purposes
5. **Add Notifications**: Send push notifications when critical alerts are detected

## Files Created/Modified

✅ **Created:**
- `src/components/EmergencyAlertWidget.tsx` - Red Alert Widget Component
- `server/migrations/create_ai_triage_logs_table.sql` - Database Migration
- `server/migrations/run_ai_triage_migration.cjs` - Migration Runner

✅ **Modified:**
- `server/ems.cjs` - Added `/live-alerts` and `/analyze-photo` routes
- `src/components/Dashboard.tsx` - Integrated EmergencyAlertWidget

