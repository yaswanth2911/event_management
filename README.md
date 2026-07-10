# ⚡ EventConnect

EventConnect is a modern, high-performance full-stack event management and reservation system. Built using a decoupled architecture, it features a responsive, dynamic front-end powered by React (Vite) and a robust, secure back-end built with Django REST Framework. The application supports user authentication, dynamic event filtering, and production-ready automated payment collection.

## 🚀 Live Links
*   **Live Web Frontend:** [https://event-management-ochre-eta.vercel.app](https://event-management-ochre-eta.vercel.app)
*   **Production API Server:** [https://event-management-i1tc.onrender.com/api](https://event-management-i1tc.onrender.com/api)

---

## 🛠️ Architecture & Tech Stack

### Frontend Architecture
*   **Core Library:** React JS (Functional Components & Hooks)
*   **Build Tool:** Vite (Optimized production asset compilation)
*   **State & Networking:** Axios (Dynamic data fetching instances with automated JWT interception & Token Refreshing)
*   **Styling:** Modern, scannable UI layout components
*   **Hosting:** Vercel

### Backend Engine
*   **Framework:** Django & Django REST Framework (DRF)
*   **Database Integration:** Production-optimized SQL Engine via `dj-database-url`
*   **Security & Gateways:** CORS headers whitelisting, JWT authentication, and secure `Razorpay` payment signature verification.
*   **Server Gateway:** Gunicorn WSGI HTTP server
*   **Hosting:** Render

---

## ✨ Features
*   **Dynamic Event Dashboard:** Seamless search filtering by event title, venue, or category descriptions.
*   **Secure Authentication Loop:** JWT token workflow with automated silent background token refreshing (`/api/token/refresh/`) to protect active route states.
*   **Real-time Availability:** Visual tracking of remaining seats per event tier.
*   **Automated Payments:** Integrated Razorpay checkout popup handling server-side signature verification.

---

## 💻 Local Installation & Setup

Clone the repository before following the setup steps for each layer:
```bash
git clone [https://github.com/yaswanth2911/event_management.git](https://github.com/yaswanth2911/event_management.git)
cd event_management

```

### 1. Backend Setup (`/backend`)

1. Create and activate a Python virtual environment:
`
python -m venv venv
# On Windows:
.\venv\Scripts\activate


2. Install standard dependencies:

pip install -r requirements.txt

3. Set up your local environment variables in a `.env` file:
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret


4. Run migrations and start the Django server:

python manage.py migrate
python manage.py runserver


### 2. Frontend Setup (`/frontend`)

1. Navigate to the frontend directory:
cd frontend


2. Install the necessary Node modules:

npm install


3. Create a `.env` configuration file to link the Axios gateway:
VITE_API_BASE_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)


4. Fire up the local Vite development instance:

npm run dev


## 🌐 Production Deployment Guide

### Backend (Render)

* Deploys automatically using the root `build.sh` sequence.
* Runs via **Gunicorn** linked to the production database pool.
* Requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` variables configured in Render's environment settings.

### Frontend (Vercel)

* **Framework Preset:** Vite
* **Root Directory Override:** `frontend`
* **Environment Variable Key:** `VITE_API_BASE_URL` pointing directly to your live production backend HTTPS domain.



Would you like me to expand on any specific feature sections, or add detailed documentation for the API endpoints in the README?
