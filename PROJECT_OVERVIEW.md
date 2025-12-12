# Project Overview: Anomaly Detection Behavioral Analytics

This project is a comprehensive behavioral analytics and anomaly detection system. It monitors user activities (network, email) and uses machine learning to detect anomalies. The system consists of a React frontend, a Node.js/Express backend, a Python/FastAPI ML backend, and standalone monitoring agents.

## Architecture

The project is divided into four main components:

1.  **Frontend (`/frontend`)**: A React-based user interface for visualizing data and managing the system.
2.  **Backend (`/backend`)**: A Node.js/Express server acting as the primary API gateway, handling authentication and data persistence.
3.  **ML Backend (`/ml_backend`)**: A Python/FastAPI service dedicated to machine learning tasks, such as training models and making predictions.
4.  **Monitoring Agents (`/monitoring_agents`)**: Python scripts that collect behavioral data (email, network) and send it to the system.

## Technology Stack

### Frontend (`/frontend`)
*   **Framework**: React 18
*   **Build Tool**: Create React App (react-scripts)
*   **Routing**: React Router DOM
*   **Styling/Animation**: Framer Motion, GSAP, Three.js (@react-three/fiber, @react-three/drei)
*   **HTTP Client**: Axios
*   **Data Visualization**: Recharts
*   **UI Components**: Lucide React (Icons)
*   **State Management**: (Implicit through React hooks/Context)

### Backend (`/backend`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (via Mongoose)
*   **Authentication**: Passport.js (Google OAuth), JWT, BCrypt
*   **Validation**: Express Validator

### ML Backend (`/ml_backend`)
*   **Runtime**: Python
*   **Framework**: FastAPI
*   **Server**: Uvicorn
*   **ML Libraries**: Scikit-learn, NumPy, Pandas
*   **Serialization**: Joblib

### Monitoring Agents (`/monitoring_agents`)
*   **Language**: Python
*   **Scripts**:
    *   `email_monitor.py`: Monitors email activity.
    *   `network_monitor.py`: Monitors network traffic.

## Directory Structure

*   `frontend/`: Source code for the React UI.
    *   `src/`: Components, pages, services, and styles.
*   `backend/`: Source code for the Node.js API.
    *   `controllers/`: Request handlers.
    *   `models/`: Mongoose schemas.
    *   `routes/`: API route definitions.
    *   `middleware/`: Auth and validation middleware.
*   `ml_backend/`: Source code for the ML service.
    *   `app/`: Main application code (API, models).
    *   `data/`: Training data storage.
    *   `saved_models/`: Serialized ML models.
*   `monitoring_agents/`: Standalone data collection scripts.

## Key Features (Inferred)
*   **User Authentication**: Secure login/signup including Google OAuth.
*   **Dashboard**: Visualizations of behavioral data and detected anomalies.
*   **3D Visualization**: Potential use of 3D elements for data representation (Three.js).
*   **Real-time Monitoring**: Agents likely report data in near real-time.
*   **Anomaly Detection**: ML models trained to spot unusual patterns in network or email usage.
