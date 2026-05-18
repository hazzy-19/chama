# Missing Features & Fintech Best Practices

## Overview
This document outlines all unimplemented features critical for a production-ready financial savings group (Chama) platform. These features ensure regulatory compliance, fraud prevention, data security, and fair user policies aligned with fintech industry standards.

---

## 1. DEPOSIT MANAGEMENT

### 1.1 Deposit Overpayment Handling
**Status**: ❌ NOT IMPLEMENTED

**Issue**: Currently, the system doesn't handle scenarios where a user deposits more than their savings target.

**Required Features**:
- Allow overpayment with clear user confirmation
- Track excess amount separately from target
- Provide options to:
  - Keep excess in savings account (earn interest if applicable)
  - Withdraw excess immediately
  - Redirect excess to new savings goal
- Notify user of overpayment state
- Generate transaction breakdown showing target vs. excess

**Implementation Hints**:
```python
# Add to Transaction model
overpayment_amount: Decimal  # Amount over target
overpayment_action: str  # "keep_savings", "withdraw", "new_goal"
```

**Fintech Best Practice**: Safaricom M-Pesa requires explicit user consent for amounts exceeding thresholds. Display a confirmation dialog when deposit exceeds target.

---

### 1.2 Partial Deposit Allocation
**Status**: ❌ NOT IMPLEMENTED

**Issue**: System doesn't support allocating a single deposit across multiple goals/accounts.

**Required Features**:
- Allow users to split a deposit between multiple savings goals
- Allocate percentage or fixed amount to each goal
- Persist allocation strategy for recurring patterns
- Track which deposit portions went to which goals

**SQL Schema Addition**:
```sql
ALTER TABLE transactions ADD COLUMN allocation_details JSONB;
-- Example: {"goal_1": 5000, "goal_2": 3000, "emergency_fund": 2000}
```

---

### 1.3 Deposit Receipt & Transaction Proof
**Status**: ⚠️ PARTIALLY IMPLEMENTED

**Current State**: M-Pesa receipt captured in `mpesa_receipt_number`, but no PDF/email receipt system.

**Missing**:
- Generate downloadable PDF receipt with:
  - Transaction ID
  - Deposit date/time
  - Amount
  - M-Pesa receipt number
  - Savings goal details
  - Remaining balance to target
- Email receipt to user
- SMS receipt (WhatsApp integration planned)
- Receipt archive/history page

**Implementation**:
```python
# Add to requirements.txt
reportlab==4.0.9  # For PDF generation
```

---

## 2. WITHDRAWAL MANAGEMENT

### 2.1 Withdrawal Reversal
**Status**: ❌ NOT IMPLEMENTED

**Issue**: Users cannot reverse/cancel a withdrawal within a grace period.

**Required Features**:
- 24-hour grace period to reverse withdrawal request
- Automatic refund to original account if reversed within grace period
- Track withdrawal state: `requested` → `reversed` or `completed`
- Notify guardian if applicable
- Log reversal reason

**Database Schema**:
```python
# Add to Transaction model
reversal_requested_at: Optional[datetime]
reversal_reason: Optional[str]
reversal_status: str  # "none", "pending", "approved", "completed"
```

**Fintech Best Practice**: Per FCA (UK) and CBK (Kenya) guidelines, provide 24-48 hour reversal window for consumer protection.

---

### 2.2 Withdrawal Limits & Rate Limiting
**Status**: ❌ NOT IMPLEMENTED

**Issue**: No limits on withdrawal frequency or daily/monthly amounts.

**Required Features**:
- Daily withdrawal limit (e.g., KES 50,000)
- Monthly withdrawal limit (e.g., KES 500,000)
- Minimum withdrawal amount (e.g., KES 100)
- Withdrawal frequency limits (e.g., max 5 per day)
- Cooling-off period between withdrawals
- Enhanced verification for large withdrawals (> 100K)

**Implementation**:
```python
class WithdrawalPolicy:
    daily_limit: Decimal = Decimal("50000")
    monthly_limit: Decimal = Decimal("500000")
    min_amount: Decimal = Decimal("100")
    max_per_day: int = 5
    hours_between_withdrawals: int = 2
    large_withdrawal_threshold: Decimal = Decimal("100000")
    requires_otp_above: Decimal = Decimal("50000")
```

**Fintech Best Practice**: Protects users from account takeover fraud and regulatory compliance with PSD2/CBK guidelines.

---

### 2.3 Withdrawal Request Approval Workflow
**Status**: ⚠️ PARTIALLY IMPLEMENTED

**Current State**: `guardian_approved` field exists but no approval workflow.

**Missing**:
- Guardian approval notification (WhatsApp/SMS/Email)
- Guardian dashboard to view/approve/reject withdrawals
- Approval timeout (auto-approve after 48 hours if no response)
- Multiple approval levels for large amounts
- Audit log of all approvals/rejections
- Reason field for rejection

**Workflow States**:
```
initiated → pending_approval → guardian_review → 
  [approved → processing → completed] OR 
  [rejected → notify_user]
```

---

### 2.4 Withdrawal Destination Management
**Status**: ❌ NOT IMPLEMENTED

**Issue**: All withdrawals go to the original phone number; no multi-account support.

**Required Features**:
- Allow user to register multiple M-Pesa accounts
- Withdraw to different phone numbers (with verification)
- Default withdrawal account preference
- Withdrawal history per account
- Prevent withdrawals to unverified accounts
- Require OTP verification for account changes

**Database Schema**:
```python
class UserAccount(Base):
    __tablename__ = "user_accounts"
    account_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    phone_number = Column(String, unique=True)
    account_type = Column(String)  # "M-Pesa", "Bank", etc.
    is_verified = Column(Boolean, default=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

## 3. CONTRACT TERMINATION

### 3.1 Early Contract Termination
**Status**: ❌ NOT IMPLEMENTED

**Issue**: System doesn't support early contract cancellation/termination.

**Required Features**:
- Allow user to terminate savings contract early
- Options for early termination:
  - **Immediate Termination**: User receives all funds immediately (may incur penalty)
  - **Withdraw & Close**: Transfer all savings to specified account, close goal
  - **Pause & Resume**: Temporarily suspend but maintain option to resume
- Termination fee structure (e.g., 2% penalty if < 6 months)
- Guardian approval required for termination (if applicable)
- Final settlement calculation and payout
- Termination reason tracking
- Regulatory compliance documentation

**Implementation**:
```python
class GoalTermination(Base):
    __tablename__ = "goal_terminations"
    termination_id = Column(String, primary_key=True)
    goal_id = Column(String, ForeignKey("goals.id"))
    user_id = Column(String, ForeignKey("users.id"))
    termination_type = Column(String)  # "immediate", "withdraw_close", "pause"
    termination_reason = Column(String)  # "financial_hardship", "goal_change", etc.
    penalty_applied: Decimal
    final_payout_amount: Decimal
    status = Column(String, default="pending")  # pending, approved, completed
    requested_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
```

**Fintech Best Practice**: FCA/CBK require clear termination policies with reasonable penalties. Essential for consumer protection and regulatory compliance.

---

### 3.2 Contract Pause & Resume
**Status**: ❌ NOT IMPLEMENTED

**Issue**: Users cannot pause savings without terminating the contract.

**Required Features**:
- Pause saving temporarily (e.g., 30-90 days)
- No deposits/withdrawals during pause
- Optional interest/penalty during pause period
- Auto-resume after pause period or manual resume
- Reason tracking for pause
- Multiple pause periods allowed per goal
- Guardian notification

---

### 3.3 Goal Modification
**Status**: ❌ NOT IMPLEMENTED

**Issue**: Users cannot modify savings target, timeline, or terms after goal creation.

**Required Features**:
- Increase target amount
- Extend/shorten deadline
- Change contribution frequency
- Modify auto-pay settings
- Guardian approval for significant changes
- Audit trail of all modifications
- Historical tracking of original vs. modified terms

---

## 4. DATA & TRANSACTION SECURITY

### 4.1 Transaction Encryption
**Status**: ⚠️ PARTIALLY IMPLEMENTED

**Current State**: Connection uses HTTPS, but data-at-rest not encrypted.

**Missing**:
- Database field encryption (sensitive fields):
  - Phone numbers
  - Bank account details
  - M-Pesa receipt numbers
  - Transaction amounts (optional)
- Application-level encryption/decryption
- Key management service (AWS KMS, HashiCorp Vault)
- Encryption algorithm: AES-256-GCM

**Implementation**:
```python
# Add to requirements.txt
cryptography==41.0.0
sqlalchemy-utils==0.41.0

# Encrypt sensitive fields
from cryptography.fernet import Fernet

class EncryptedColumn(TypeDecorator):
    impl = String
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        cipher = Fernet(os.getenv("ENCRYPTION_KEY"))
        return cipher.encrypt(value.encode()).decode()
    
    def process_result_value(self, value, dialect):
        if value is None:
            return value
        cipher = Fernet(os.getenv("ENCRYPTION_KEY"))
        return cipher.decrypt(value.encode()).decode()
```

**Fintech Best Practice**: PSD2, GDPR, and CBK regulations require encryption of personally identifiable information (PII).

---

### 4.2 Audit Logging
**Status**: ❌ NOT IMPLEMENTED

**Issue**: No audit trail for critical operations.

**Required Features**:
- Log all financial transactions (deposits, withdrawals)
- Log all user account changes (settings, phone, email)
- Log all guardian actions (approvals, rejections)
- Log all admin/staff actions if applicable
- Immutable audit log (cannot be deleted)
- Include:
  - User ID, IP address, timestamp
  - Action type and description
  - Before/after values for modifications
  - Approval chain information

**Database Schema**:
```python
class AuditLog(Base):
    __tablename__ = "audit_logs"
    log_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String)  # "deposit", "withdrawal", "goal_created", etc.
    resource_type = Column(String)  # "transaction", "user", "goal"
    resource_id = Column(String)
    old_value = Column(Text)  # JSON
    new_value = Column(Text)  # JSON
    ip_address = Column(String)
    user_agent = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String)  # "success", "failure"
    error_message = Column(String, nullable=True)
```

**Fintech Best Practice**: Mandatory for PCI-DSS, GDPR, CBK, and SOX compliance.

---

### 4.3 Two-Factor Authentication (2FA)
**Status**: ❌ NOT IMPLEMENTED

**Current State**: Only Firebase email/password auth.

**Missing**:
- TOTP (Time-based One-Time Password) via Google Authenticator/Authy
- SMS OTP for sensitive operations (withdrawals > KES 50K)
- Backup codes for account recovery
- 2FA enforcement for large transactions
- SMS rate limiting (max 3 OTPs per hour)
- OTP expiry (5 minutes)

**Implementation**:
```python
# Add to requirements.txt
pyotp==2.9.0
qrcode==7.4.2

# Add to User model
two_factor_enabled: bool = False
totp_secret: Optional[str] = None
backup_codes: Optional[str] = None  # JSON-encoded, encrypted
```

---

### 4.4 Rate Limiting & Brute Force Protection
**Status**: ❌ NOT IMPLEMENTED

**Issue**: No protection against repeated login attempts, API abuse.

**Required Features**:
- Rate limit by IP address
- Rate limit by user ID
- Progressive lockout (5 failed attempts → 15 min lockout → 1 hour → 24 hour)
- Captcha after 3 failed attempts
- Notification on suspicious activity
- API rate limiting (100 requests/minute per user)
- Endpoint-specific limits (login: 5/min, balance check: 60/min)

**Implementation**:
```python
# Add to requirements.txt
slowapi==0.1.9  # Rate limiting for FastAPI
redis==5.0.0    # For distributed rate limiting

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login(credentials: LoginRequest):
    pass
```

---

## 5. USER POLICIES & COMPLIANCE

### 5.1 Terms of Service & Privacy Policy
**Status**: ❌ NOT IMPLEMENTED

**Missing**:
- **Terms of Service** covering:
  - User rights and responsibilities
  - Liability limitations
  - Dispute resolution process
  - Penalties for fraud/misuse
  - Changes to T&C process
  
- **Privacy Policy** covering:
  - Data collection and usage
  - Third-party sharing (M-Pesa, WhatsApp, etc.)
  - Cookie and tracking policies
  - Data retention and deletion
  - User rights (access, portability, erasure)
  - GDPR/CCPA compliance
  
- **Cookie Banner** with granular consent
- Version control and user acceptance tracking

---

### 5.2 KYC (Know Your Customer) Verification
**Status**: ⚠️ PARTIALLY IMPLEMENTED

**Current State**: Email and phone stored, but no ID verification.

**Missing**:
- National ID verification (Kenyan ID, Passport)
- Facial recognition for liveness check
- Address verification
- Proof of income for high-value transactions
- Sanctions screening (OFAC, UN lists)
- PEP (Politically Exposed Person) check
- Risk scoring based on KYC data
- Annual KYC refresh/re-verification

**Compliance**: CBK, FINTRAC, and international AML/CFT standards require KYC.

---

### 5.3 AML (Anti-Money Laundering) Controls
**Status**: ❌ NOT IMPLEMENTED

**Required Features**:
- Transaction monitoring for suspicious patterns:
  - Rapid deposit/withdrawal cycles
  - Round-number amounts
  - Unusual timing patterns
  - Multiple accounts by same user
  
- Suspicious Activity Reporting (SAR) to regulator
- Customer Risk Assessment (CRA) by transaction size
- Threshold for escalation (e.g., >KES 1M per day)
- Blocked/sanctioned account list checking
- Geographic risk assessment

**Implementation**:
```python
class AMLAlert(Base):
    __tablename__ = "aml_alerts"
    alert_id = Column(String, primary_key=True)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    risk_score = Column(Float)  # 0-100
    risk_factors = Column(JSON)  # ["rapid_cycle", "round_amount", ...]
    alert_type = Column(String)  # "suspicious", "threshold", "sanctioned"
    status = Column(String)  # "pending_review", "flagged", "cleared"
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

### 5.4 Complaints & Dispute Resolution
**Status**: ❌ NOT IMPLEMENTED

**Required Features**:
- User-initiated complaint submission form
- Complaint tracking with unique ID
- SLA for response (48 hours acknowledgment, 14 days resolution target)
- Multiple dispute channels (in-app, email, phone)
- Escalation levels (Tier 1 Support → Manager → Ombudsman)
- Documentation and evidence submission
- Dispute outcome notification
- Regulatory escalation to CBK if unresolved

**Database Schema**:
```python
class Complaint(Base):
    __tablename__ = "complaints"
    complaint_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    transaction_id = Column(String, nullable=True)
    complaint_type = Column(String)  # "transaction_error", "unauthorized", etc.
    description = Column(Text)
    supporting_docs = Column(JSON)  # URLs to uploaded docs
    status = Column(String, default="open")  # open, in_review, resolved, escalated
    priority = Column(String)  # "low", "medium", "high"
    assigned_to = Column(String, nullable=True)  # Support agent
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    days_to_resolve = Column(Integer, computed=True)
```

---

### 5.5 Fair Use & Acceptable Use Policy
**Status**: ❌ NOT IMPLEMENTED

**Required Coverage**:

#### Prohibited Activities
- Money laundering, terrorist financing
- Fraud or deception
- Market manipulation
- Unlicensed financial services
- Circumventing sanctions
- Child labor proceeds
- Illegal drug trade

#### Account Suspension/Termination Triggers
- 3+ AML alerts in 30 days
- Transaction reversal rate > 5%
- Repeated failed OTP attempts
- Violation of user agreement
- Suspected account compromise
- Regulatory investigation

#### Fair Dealing Policies
- **Overdraft Prevention**: No overdraft facilities; rejection of requests over balance
- **Interest/Fee Transparency**: Clear disclosure of all fees, interest rates
- **No Hidden Charges**: All fees must be pre-disclosed
- **Inactivity Policy**: Account dormancy after 12 months of no activity
- **Dormancy Fee**: Optional fee after dormancy threshold
- **Data Retention**: User data retained for 7 years post-account closure

---

### 5.6 Consent & Preference Management
**Status**: ⚠️ PARTIAL

**Current State**: No explicit consent for data usage.

**Missing**:
- Granular consent options:
  - Marketing communications
  - Product improvements data
  - Third-party analytics
  - WhatsApp notifications
  - SMS notifications
  - Email notifications
  
- Consent audit trail (what was consented, when, by whom)
- Easy withdrawal of consent
- Default to opt-out for non-essential communications
- Re-consent requirement annually

---

## 6. OPERATIONAL RESILIENCE

### 6.1 Backup & Disaster Recovery
**Status**: ❌ NOT IMPLEMENTED

**Missing**:
- Daily automated database backups
- Backup encryption
- Off-site backup storage (separate region/provider)
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour
- Backup integrity verification
- Annual disaster recovery drills

---

### 6.2 Monitoring & Alerting
**Status**: ❌ NOT IMPLEMENTED

**Required**:
- System health monitoring (CPU, memory, disk, database)
- API response time monitoring
- Error rate monitoring
- Database connection pool monitoring
- Payment gateway uptime monitoring
- Alert thresholds and escalation
- Alert channels: Slack, PagerDuty, SMS
- Incident response playbooks

---

### 6.3 API Security & Documentation
**Status**: ⚠️ PARTIAL

**Current State**: API exists but lacks security headers.

**Missing**:
- Security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`
  - `Content-Security-Policy`
  
- API versioning strategy
- Deprecation policy for API endpoints
- OpenAPI/Swagger documentation
- API key management (if needed)
- CORS policy review
- Request/response validation

---

## 7. THIRD-PARTY INTEGRATIONS

### 7.1 M-Pesa Integration Robustness
**Status**: ⚠️ BASIC

**Current State**: STK Push implemented, callback handling exists.

**Missing**:
- Retry mechanism for failed requests (exponential backoff)
- Idempotency keys to prevent duplicate charges
- Rate limiting to respect Safaricom throttles
- Circuit breaker pattern for API failures
- Fallback to manual confirmation if callback fails
- Timeout handling (transaction stays "pending" > 5 mins)
- Comprehensive error code mapping
- Safaricom outage handling (user notification)

**Implementation**:
```python
from tenacity import retry, wait_exponential, stop_after_attempt

@retry(
    wait=wait_exponential(multiplier=1, min=4, max=10),
    stop=stop_after_attempt(3)
)
async def initiate_stk_with_retry(phone, amount):
    return await mpesa_client.initiate_stk_push(phone, amount)
```

---

### 7.2 Firebase Authentication Best Practices
**Status**: ⚠️ IMPLEMENTED BUT INCOMPLETE

**Missing**:
- Email verification requirement
- Phone number verification (OTP)
- Account deletion feature
- Data export feature (GDPR compliance)
- Session timeout and refresh token handling
- Device fingerprinting for device-specific authentication
- Anomalous login detection
- Sign-out all devices option
- Activity history and session management

---

### 7.3 WhatsApp Integration (Paused)
**Status**: ❌ PAUSED

**Current State**: Guardian request integration paused per requirements.

**Missing Features When Resumed**:
- Webhook signature verification
- Message template management
- Rate limiting (WhatsApp limits ~1000 messages/day per account)
- Media attachment support (receipts, statements)
- Interactive buttons for approval workflows
- Scheduled message delivery
- Two-way conversation support
- Language localization
- Fallback to SMS if WhatsApp unavailable

---

## 8. REPORTING & ANALYTICS

### 8.1 User Dashboards
**Status**: ⚠️ BASIC

**Missing**:
- Savings progress visualization (pie charts, progress bars)
- Contribution history chart
- Goal achievement timeline
- Projected savings at current rate
- Month-over-month savings comparison
- Transaction export (CSV, PDF)
- Savings statistics (total saved, average transaction, etc.)

---

### 8.2 Administrative Dashboards
**Status**: ❌ NOT IMPLEMENTED

**Required**:
- User registration trends
- Active users count
- Total deposits/withdrawals tracked
- AML alerts dashboard
- Complaint status overview
- System health metrics
- Revenue metrics (if charging fees)
- Guardian approval rates

---

### 8.3 Regulatory Reporting
**Status**: ❌ NOT IMPLEMENTED

**Required For CBK Compliance**:
- Monthly transaction volume reporting
- Customer due diligence (CDD) metrics
- AML suspicious activity reports (SARs)
- Fraud incident reporting
- System availability/uptime reporting
- Data breach notification logs

---

## 9. FRONTEND ENHANCEMENTS

### 9.1 Error Handling
**Status**: ⚠️ PARTIAL

**Missing**:
- User-friendly error messages (not HTTP codes)
- Error recovery suggestions
- Offline mode support (cache balance, past transactions)
- Automatic retry UI
- Error logging and reporting to backend
- Loading states and skeletons
- Toast notifications for long operations

---

### 9.2 Accessibility
**Status**: ❌ NOT IMPLEMENTED

**Missing**:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Text size adjustment
- Language localization (Swahili)
- Right-to-left (RTL) support if needed

---

### 9.3 Mobile Responsiveness
**Status**: ⚠️ PARTIAL

**Missing**:
- Bottom sheet modals (mobile UX)
- Touch-friendly button sizes (minimum 44x44px)
- Mobile-optimized forms
- Swipe gestures
- Mobile-specific performance optimization

---

## 10. IMPLEMENTATION PRIORITY & ROADMAP

### Phase 1: Critical (Weeks 1-2)
- ✅ Fix database schema (DONE)
- Implement Withdrawal Limits & Rate Limiting
- Add Audit Logging
- Implement 2FA/OTP
- Create Complaints & Dispute Resolution system

### Phase 2: Important (Weeks 3-4)
- KYC/AML Controls
- Transaction Encryption
- Withdrawal Reversal
- Receipt & Transaction Proof
- Rate Limiting & Brute Force Protection

### Phase 3: Compliance (Weeks 5-6)
- Terms of Service & Privacy Policy
- Fair Use Policy
- Data Export & Account Deletion
- Backup & Disaster Recovery

### Phase 4: Enhancement (Weeks 7-8)
- Early Termination
- Contract Pause/Resume
- Multiple Withdrawal Accounts
- Monitoring & Alerting
- Admin Dashboards

### Phase 5: Polish (Weeks 9+)
- Frontend Accessibility
- Error Handling Improvements
- Performance Optimization
- Analytics Dashboards

---

## 11. COMPLIANCE CHECKLIST

- [ ] CBK (Central Bank of Kenya) regulations
- [ ] FINTRAC (Financial Intelligence Unit - Kenya)
- [ ] GDPR (if EU users)
- [ ] CCPA (if US users)
- [ ] PSD2 (if EU payment services)
- [ ] PCI-DSS (if storing payment card data)
- [ ] SOX (if publicly traded)
- [ ] Data Protection Act 2019 (Kenya)
- [ ] Money Laundering Prevention Act (Kenya)

---

## 12. SECURITY BEST PRACTICES

- [ ] All passwords hashed with bcrypt/Argon2
- [ ] HTTPS enforced (no HTTP)
- [ ] HSTS header enabled
- [ ] CSRF tokens on state-changing operations
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (input validation, output escaping)
- [ ] CORS policy configured restrictively
- [ ] Secrets managed via environment variables
- [ ] No hardcoded credentials
- [ ] API keys rotated quarterly
- [ ] Sensitive logs masked (phone, account numbers)
- [ ] Penetration testing conducted annually

---

## 13. GLOSSARY

- **AML**: Anti-Money Laundering
- **CBK**: Central Bank of Kenya
- **CDD**: Customer Due Diligence
- **FINTRAC**: Financial Intelligence Unit
- **GDPR**: General Data Protection Regulation (EU)
- **KYC**: Know Your Customer
- **OTP**: One-Time Password
- **PCI-DSS**: Payment Card Industry Data Security Standard
- **PSD2**: Revised Payment Services Directive (EU)
- **SAR**: Suspicious Activity Report
- **SOX**: Sarbanes-Oxley Act (US public companies)
- **TOTP**: Time-based One-Time Password
- **T&C**: Terms and Conditions

---

## 14. USEFUL RESOURCES

- [CBK Supervision Guidelines](https://www.centralbank.go.ke/)
- [FINTRAC Money Laundering & Terrorist Financing](https://www.fintrac.go.ke/)
- [GDPR Compliance Guide](https://gdpr-info.eu/)
- [PCI-DSS Standards](https://www.pcisecuritystandards.org/)
- [OWASP Security Best Practices](https://owasp.org/)
- [Safaricom M-Pesa Developer Documentation](https://developer.safaricom.co.ke/)
- [Firebase Security Best Practices](https://firebase.google.com/support/guides/security-checklist)

---

**Last Updated**: May 2026  
**Document Version**: 1.0  
**Maintained By**: Development Team  
**Next Review**: August 2026
