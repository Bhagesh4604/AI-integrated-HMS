# Saving Lives (HMS) - Setup Instructions
**Imagine Cup 2025 Compliant Version**

## 1. Prerequisites
-   Node.js v18+
-   MySQL Server (Local or Azure Flexible Server)
-   Azure Account (Free Student Subscription)

---

## 2. Environment Configuration (.env)
Create a `.env` file in the root directory.

### Core Database
```env
DB_HOST=localhost (or your-azure-server.mysql.database.azure.com)
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hms_db
DB_SSL=false (Set to 'true' if using Azure)
```

### Azure Services (Required for Imagine Cup)
```env
# Azure OpenAI (Critical)
AZURE_OPENAI_ENDPOINT="https://<your-resource>.openai.azure.com/"
AZURE_OPENAI_API_KEY="<your-key>"
AZURE_OPENAI_DEPLOYMENT_ID="gpt-4o"

# Azure Communication Services (SMS)
# Note: If reusing your Infobip number or using Mock Mode due to region limits
ACS_CONNECTION_STRING="endpoint=https://<resource>.communication.azure.com/;accesskey=<key>"
ACS_PHONE_NUMBER="+18005551234"

# Azure Notification Hubs (Push)
AZURE_NH_CONNECTION_STRING="Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=..."
AZURE_NH_HUB_NAME="<hub-name>"
```

---

## 3. Database Setup
1.  **Import SQL**: Import the `hms.sql` file into your MySQL database.
    ```bash
    mysql -u root -p hms_db < hms.sql
    ```

---

## 4. Run the Project

### Install Dependencies
```bash
npm install
```

### Start Backend (Port 8080)
```bash
npm run server
```

### Start Frontend (Port 5173)
```bash
npm run dev
```

---

## 5. Testing the Flow (Demo Script)

1.  **Patient App**:
    -   Login as Patient.
    -   Click **"Book Ambulance"**.
    -   **Action**: Upload a crash photo.
    -   **Result**: AI Verifies image -> "Verified".

2.  **Paramedic App**:
    -   (Simulated Paramedic ID: `EMP002`)
    -   Check Console Logs (`[Azure Push]`) or UI toast for "New Trip".

3.  **Hospital Dashboard**:
    -   Login as Admin (`admin@hms.com` / `admin123`).
    -   View **Live Map** tracking.

## 6. Troubleshooting

*   **SMS/Push Failed?**: Check the console. If you are in a restricted region (e.g., India Student Trial), the system automatically switches to **MOCK MODE** (logs to terminal) to prevent crashes.
*   **Database SSL**: If connecting to Azure MySQL, ensure `DB_SSL=true`.
