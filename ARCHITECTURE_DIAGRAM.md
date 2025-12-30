# Architecture Diagram (Imagine Cup 2025)

Copy the code below into [Mermaid Live Editor](https://mermaid.live/). This version uses strict quoting to avoid syntax errors and lays out clearly from Left to Right.

```mermaid
graph LR
    %% Styles
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef cloud fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef backend fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;

    %% Nodes
    subgraph Clients ["Frontend Applications"]
        Patient["Patient App (Mobile)"]:::client
        Paramedic["Paramedic App (Mobile)"]:::client
        Hospital["Hospital Dashboard (Web)"]:::client
    end

    subgraph Backend ["Backend System"]
        API["Node.js API Server"]:::backend
    end

    subgraph Azure ["Microsoft Azure Cloud"]
        OpenAI["Azure OpenAI (Image Analysis)"]:::cloud
        MySQL["((Azure MySQL Database))"]:::cloud
        Comms["Azure Comm. Services (SMS)"]:::cloud
        NotifHub["Azure Notification Hubs"]:::cloud
    end

    %% Flows
    Patient -- "1. Upload Accident Photo" --> API
    API -- "2. Verify Image" --> OpenAI
    OpenAI -- "3. Return Verification (Real/Fake)" --> API
    
    API -- "4. Save Trip Data" --> MySQL
    
    API -- "5. Dispatch Alert (Push)" --> NotifHub
    NotifHub -.-> Paramedic
    
    API -- "6. Send SMS Alert" --> Comms
    Comms -.-> Patient
    
    API -- "7. Live Tracking (WebSocket)" --> Hospital
```
