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

---

## Missing Features & Production Roadmap

⚠️ **This application is in early development.** Before deploying to production, review [MISSING_FEATURES.md](./MISSING_FEATURES.md) for a comprehensive list of unimplemented features, compliance requirements, and security best practices.

### Key Areas Not Yet Implemented

1. **Deposit Management**
   - Overpayment handling
   - Partial deposit allocation
   - Transaction receipts & proof

2. **Withdrawal Management**
   - Withdrawal reversal (24-hour grace period)
   - Withdrawal limits & rate limiting
   - Withdrawal approval workflows
   - Multiple withdrawal accounts

3. **Contract Management**
   - Early contract termination
   - Contract pause & resume
   - Goal modification after creation

4. **Security & Compliance**
   - Transaction encryption
   - Audit logging
   - Two-factor authentication (2FA/OTP)
   - Rate limiting & brute force protection
   - KYC verification
   - AML monitoring

5. **User Policies**
   - Terms of Service & Privacy Policy
   - Complaints & dispute resolution
   - Fair Use policies
   - Consent management

6. **Operational**
   - Backup & disaster recovery
   - Monitoring & alerting
   - API security hardening
   - Third-party integration robustness

7. **Frontend**
   - Accessibility (WCAG 2.1)
   - Mobile optimization
   - Advanced error handling
   - Offline support

### Compliance Requirements

- [ ] CBK (Central Bank of Kenya) regulations
- [ ] GDPR/CCPA data protection
- [ ] PCI-DSS (if handling payment cards)
- [ ] AML/CFT (Anti-Money Laundering / Counter-Terrorist Financing)
- [ ] KYC (Know Your Customer) verification

### Critical Before Production

1. ✅ Fix database schema (completed)
2. 🔲 Implement withdrawal limits & rate limiting
3. 🔲 Add audit logging
4. 🔲 Implement 2FA/OTP verification
5. 🔲 Set up transaction encryption
6. 🔲 Create complaints & dispute resolution
7. 🔲 Conduct security audit & penetration testing
8. 🔲 Legal review of T&C and privacy policy
9. 🔲 Backup & disaster recovery setup

---

## Environment Variables

### Backend (.env)

```env
# PostgreSQL
POSTGRES_SERVER=localhost
POSTGRES_USER=peter
POSTGRES_PASSWORD=4455
POSTGRES_DB=chama
POSTGRES_PORT=5432

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# M-Pesa Daraja (Sandbox)
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
NGROK_URL=https://your-ngrok-url.ngrok-free.app
APP_DOMAIN_URL=https://yourdomain.com
APP_ENV=development  # Set to 'production' in production

# WhatsApp (paused)
WHATSAPP_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

---

## Known Issues

- 🔴 **Withdrawal endpoint not implemented** - Returns 500 error
- 🟡 **No transaction reversal support** - Completed transactions cannot be reversed
- 🟡 **No deposit overpayment handling** - User cannot deposit above target
- 🟡 **Guardian features incomplete** - WhatsApp integration paused
- 🟡 **No withdrawal approval workflow** - Guardians cannot approve withdrawals

---

## Architecture

```
learn py/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Config, M-Pesa client, tasks
│   │   ├── db/              # Database session
│   │   ├── models/          # SQLAlchemy ORM models
│   │   └── schemas/         # Pydantic request/response schemas
│   ├── main.py              # FastAPI app entry point
│   ├── requirements.txt      # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API & Firebase services
│   │   ├── context/         # React context providers
│   │   └── App.tsx          # Main app component
│   ├── package.json         # Node.js dependencies
│   └── vite.config.ts       # Vite configuration
└── MISSING_FEATURES.md      # Roadmap & compliance checklist
```

---

## Contributing

Before committing changes:

1. Ensure all tests pass
2. Run linting (eslint for frontend, black/flake8 for backend)
3. Update documentation if adding features
4. Reference [MISSING_FEATURES.md](./MISSING_FEATURES.md) for security/compliance requirements

---

## Support

For issues or questions:
1. Check [MISSING_FEATURES.md](./MISSING_FEATURES.md) for known limitations
2. Review backend logs: `backend.log`
3. Check browser console for frontend errors
