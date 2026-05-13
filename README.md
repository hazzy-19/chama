# Bado Mapema

This workspace includes a React frontend and FastAPI backend for a savings dashboard with M-Pesa STK Push integration.

## Backend

### Run with Uvicorn

1. Activate your Python environment:

```bash
source ".venv/bin/activate"
```

2. Install dependencies if not already installed. Use the backend requirements file:

```bash
source ".venv/bin/activate"
pip install -r backend/requirements.txt
```

3. Set required environment variables in `.env` or export them directly:

- `POSTGRES_SERVER`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CLIENT_X509_CERT_URL`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`
- `MPESA_WHITELIST_CIDRS`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `GUARDIAN_PHONE_NUMBER`

4. Start the backend API:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Optional worker

The backend also starts a background worker on startup that processes pending M-Pesa confirmations every 60 seconds. If you want to run the worker separately:

```bash
python backend/app/core/tasks.py
```

## Frontend

Start the frontend from the `frontend` folder using your normal Vite/React commands. The dashboard expects the backend API at the URL configured in `VITE_API_BASE_URL`.
