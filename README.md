<div align="center">
  <h1>🚛 FleetPilot AI</h1>
  <p><strong>Intelligent Multi-Tenant Logistics & Route Optimization Platform</strong></p>

  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
  ![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/ML_Service-FastAPI-009688?logo=fastapi&logoColor=white)
</div>

FleetPilot AI is an enterprise-grade, multi-tenant logistics orchestration platform. It provides logistics companies with isolated operational dashboards to manage vehicles, drivers, and freight bidding. The core of the platform is a sophisticated backend orchestration engine that aggregates data from numerous external APIs, applies proprietary business logic, and leverages custom Machine Learning models to optimize routes and dramatically reduce fuel costs.

---

## 🌟 Detailed Features

### 🏢 Multi-Tenant Architecture & Security
*   **Strict Data Isolation**: Each logistics company has an isolated workspace. Users can only access their own fleet, drivers, routes, and bids.
*   **JWT-Based Authentication**: Secure stateless authentication where every token encodes `user_id`, `company_id`, and `role`.
*   **Automatic Query Scoping**: Backend middleware automatically intercepts requests, extracts the `company_id` from the JWT, and enforces tenant scoping at the database level.

### 🧠 Backend Orchestration Gateway
*   **Single-Request Frontend**: The frontend never directly communicates with third-party APIs. A single click on "Optimize Route" sends one request to the backend.
*   **Sequential & Parallel API Orchestration**: The backend acts as a gateway, seamlessly coordinating data across the HERE API suite, SSR Innovation Lab APIs, OpenWeather, and TollGuru.
*   **Fault Tolerance**: If non-critical external APIs (like TollGuru or Traffic) fail or exceed quotas, the system gracefully continues the optimization workflow without failing the request.

### 🛣️ Advanced Route & Fuel Optimization
*   **Master Routing Engine**: Utilizes **HERE Geocoding & Truck Routing** to generate base routes considering truck-specific constraints (weight, dimensions, axles, hazmat).
*   **Dynamic ETA**: Merges **HERE Traffic** data to adjust ETAs based on real-time congestion and incidents.
*   **Proprietary Fuel Optimization Logic**: Analyzes base fuel estimates (via **SSR Fuel Route**), fetches state/city fuel prices (via **SSR Fuel Price**), and calculates exactly **where** and **how much** fuel to purchase to maximize cost savings while maintaining safety reserves.
*   **Context-Aware**: Integrates **TollGuru** for FASTag/Cash cost breakdowns, **OpenWeather** for en-route weather alerts, and **HERE Search** for nearby truck stops, mechanics, and hospitals.

### 📦 Freight Bidding Platform
*   **Independent Module**: A dedicated platform for load creation, carrier bidding, and vendor selection.
*   **Shared Ecosystem**: Operates as a logically independent module while sharing the same underlying authentication, tenant isolation, and database infrastructure.

---

## 🤖 Deep Dive: AI & Machine Learning Integration

FleetPilot AI moves beyond static routing by incorporating intelligent, data-driven microservices that learn and adapt.

### 1. Custom Machine Learning Service (Python FastAPI)
Operating as an independent microservice without reliance on third-party AI providers, this ML engine ingests complete route data, vehicle specs, and external conditions (weather, traffic) alongside **historical trip data**.

**Predictive Capabilities:**
*   **Fuel Consumption Prediction**: Refines base API estimates using historical vehicle performance.
*   **Final ETA Probability**: Calculates the statistical probability of delay based on historical traffic patterns and weather severity.
*   **Driver & Vendor Scoring**: Generates efficiency scores for drivers and recommendation scores for vendors based on past performance metrics.
*   **Expected Freight Bid Pricing**: Predicts optimal bid prices to assist in the Freight Bidding Platform.

### 2. Explainable AI Service (LLM Integration)
Because optimization algorithms can be a "black box," FleetPilot AI includes an optional Explainable AI microservice. This service utilizes LLMs (like OpenAI or Gemini) to translate complex data into human-readable insights.

**Capabilities:**
*   **Natural Language Justification**: Generates explanations for operational choices (e.g., *"Route B was selected because it reduces fuel cost by ₹920, avoids heavy traffic on I-5, reduces toll expenses by ₹340, and decreases total travel time by 28 minutes."*)
*   **Management Reporting**: Summarizes trips and generates automated operational intelligence reports.
*   **Non-Blocking**: Designed as a completely optional service. No core business logic or route calculation depends on this AI, ensuring high availability even if the LLM provider is down.

---

## 🏗️ Architecture & Workflow

The platform follows a strict microservices approach:
1.  **Frontend** → Sends `/api/routes/optimize` request.
2.  **Backend Gateway** → Validates JWT (`company_id`).
3.  **Data Fetching** → Retrieves truck & cargo specs.
4.  **External API Orchestration** → HERE (Geocoding, Routing, Traffic) → SSR (Route, Pricing) → TollGuru → OpenWeather → HERE (Search).
5.  **Proprietary Engines** → Runs Custom Fuel Optimization Engine.
6.  **Internal AI/ML Services** → Calls ML FastAPI service for predictions & AI service for explanations.
7.  **Aggregation** → Returns one unified JSON response to the Frontend.

---

## 🛠️ Technology Stack

*   **Frontend**: React.js
*   **Backend Gateway**: Node.js / Express (or similar)
*   **Machine Learning Microservice**: Python, FastAPI, Scikit-learn/TensorFlow
*   **AI Service**: Integration with LLM APIs (OpenAI / Gemini)
*   **External APIs**: 
    *   [HERE Location Services](https://developer.here.com/) (Routing, Traffic, Geocoding, Search)
    *   SSR Innovation Lab (Fuel Routes & Pricing)
    *   [TollGuru](https://tollguru.com/)
    *   [OpenWeather](https://openweathermap.org/)

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   API Keys for HERE, TollGuru, OpenWeather, and SSR Innovation Lab.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/fleetpilot-ai.git
cd fleetpilot-ai
```

### 2. Setup the Backend Orchestrator
```bash
cd backend
npm install
# Configure .env with your API keys and DB credentials
npm run dev
```

### 3. Setup the Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Setup the ML Microservice
```bash
cd ml_service
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
