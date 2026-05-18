"""
M-Pesa Daraja STK Push client.
Extracted and adapted from daraja-master with best practices:
  - typed exceptions
  - input validation (phone normalization, amount range)
  - token caching with proper expiry
  - base64 password generation
  - real stkpush/v1/processrequest call via httpx
"""

import base64
import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger("app.core.mpesa")

# ---------------------------------------------------------------------------
# Typed exceptions
# ---------------------------------------------------------------------------

class MpesaError(Exception):
    """Base exception for all M-Pesa errors."""


class MpesaAPIError(MpesaError):
    """Raised when Safaricom returns an unexpected HTTP status or error body."""

    def __init__(self, message: str, response_data: dict | None = None) -> None:
        self.message = message
        self.response_data = response_data
        super().__init__(self.message)


class ValidationError(MpesaError):
    """Raised for invalid phone numbers or amounts before we hit the API."""


# ---------------------------------------------------------------------------
# MpesaClient
# ---------------------------------------------------------------------------

class MpesaClient:
    """
    Async-compatible M-Pesa STK Push client.

    Uses Safaricom's sandbox by default; swap base_url for production.
    Token is cached for 50 minutes (Safaricom tokens expire after ~60 min).
    """

    SANDBOX_URL = "https://sandbox.safaricom.co.ke"
    PRODUCTION_URL = "https://api.safaricom.co.ke"
    SANDBOX_SHORTCODE = "174379"
    SANDBOX_PASSKEY = (
        "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    )

    def __init__(self) -> None:
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode = settings.MPESA_SHORTCODE.strip() or self.SANDBOX_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY.strip() or self.SANDBOX_PASSKEY
        self.callback_url = self._resolve_callback_url()

        if settings.MPESA_SHORTCODE.strip() == "" or settings.MPESA_PASSKEY.strip() == "":
            logger.warning(
                "MPESA_SHORTCODE or MPESA_PASSKEY is empty. Using sandbox defaults for testing."
            )

        if not self.callback_url or "yourdomain.com" in self.callback_url:
            logger.warning(
                "No valid callback URL was found. Set NGROK_URL or APP_DOMAIN_URL, or provide MPESA_CALLBACK_URL."
            )

        # Use sandbox; switch to PRODUCTION_URL when going live
        self.base_url = self.SANDBOX_URL

        # Token cache
        self._access_token: str | None = None
        self._token_expiry: datetime | None = None

        logger.info("MpesaClient initialised (base_url=%s)", self.base_url)

    def _resolve_callback_url(self) -> str:
        explicit = settings.MPESA_CALLBACK_URL.strip()
        if explicit:
            return explicit

        env = settings.APP_ENV.strip().lower()
        if env == "production":
            base_url = settings.APP_DOMAIN_URL.strip() or settings.NGROK_URL.strip()
        else:
            base_url = settings.NGROK_URL.strip() or settings.APP_DOMAIN_URL.strip()

        if base_url:
            return f"{base_url.rstrip('/')}{settings.API_V1_STR}/mpesa/callback"

        return explicit

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def validate_phone(self, phone: str) -> str:
        """
        Normalise phone to 254XXXXXXXXX (12 digits).
        Accepts: 07XXXXXXXX, 254XXXXXXXXX, +254XXXXXXXXX, 7XXXXXXXX.
        """
        if not phone:
            raise ValidationError("Phone number is required.")

        clean = "".join(filter(str.isdigit, phone))

        if not clean:
            raise ValidationError("Phone number must contain digits.")

        if clean.startswith("0"):
            formatted = "254" + clean[1:]
        elif clean.startswith("254"):
            formatted = clean
        elif clean.startswith("7") or clean.startswith("1"):
            formatted = "254" + clean
        else:
            formatted = clean

        if len(formatted) != 12:
            raise ValidationError(
                f"Phone number must be 12 digits (254XXXXXXXXX), got {len(formatted)}."
            )

        logger.debug("Phone %s → %s", phone, formatted)
        return formatted

    def validate_amount(self, amount: Any) -> int:
        """
        Validate and coerce amount to an integer (Safaricom requires whole shillings).
        Range: KES 10 – 150,000.
        """
        try:
            amount_float = float(amount)
        except (TypeError, ValueError):
            raise ValidationError(f"Invalid amount: {amount!r}")

        if amount_float < 10:
            raise ValidationError("Amount must be at least KES 10.")
        if amount_float > 150_000:
            raise ValidationError("Amount cannot exceed KES 150,000.")

        return int(amount_float)

    # ------------------------------------------------------------------
    # Token management
    # ------------------------------------------------------------------

    def _token_is_valid(self) -> bool:
        return bool(
            self._access_token
            and self._token_expiry
            and datetime.now() < self._token_expiry
        )

    async def get_access_token(self) -> str:
        """Fetch (or return cached) OAuth2 access token."""
        if self._token_is_valid():
            logger.debug("Using cached M-Pesa access token.")
            return self._access_token  # type: ignore[return-value]

        logger.info("Requesting new M-Pesa access token…")
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"

        async with httpx.AsyncClient(timeout=10) as client:
            try:
                resp = await client.get(
                    url,
                    auth=(self.consumer_key, self.consumer_secret),
                )
            except httpx.RequestError as exc:
                raise MpesaAPIError(f"Network error fetching token: {exc}") from exc

        if resp.status_code != 200:
            raise MpesaAPIError(
                f"Token request failed: HTTP {resp.status_code} — {resp.text}",
                response_data=resp.json() if resp.content else None,
            )

        data = resp.json()
        token = data.get("access_token")
        if not token:
            raise MpesaAPIError("No access_token in Safaricom token response.", response_data=data)

        self._access_token = token
        self._token_expiry = datetime.now() + timedelta(minutes=50)
        logger.info("M-Pesa token obtained; expires %s.", self._token_expiry.strftime("%H:%M:%S"))
        return self._access_token

    # ------------------------------------------------------------------
    # Password generation
    # ------------------------------------------------------------------

    def generate_password(self, timestamp: str) -> str:
        """Base64-encode shortcode + passkey + timestamp as required by Safaricom."""
        raw = self.shortcode + self.passkey + timestamp
        return base64.b64encode(raw.encode()).decode()

    # ------------------------------------------------------------------
    # STK Push
    # ------------------------------------------------------------------

    async def initiate_stk_push(
        self,
        phone: str,
        amount: Any,
        transaction_id: str,
        account_reference: str | None = None,
    ) -> dict:
        """
        Trigger an STK Push prompt on the customer's phone.

        Returns the raw Safaricom response dict on success, which includes:
            - CheckoutRequestID  (store this as the canonical transaction ID)
            - MerchantRequestID
            - ResponseCode       ("0" = accepted by Safaricom, payment still pending)
            - ResponseDescription
            - CustomerMessage

        Raises MpesaAPIError or ValidationError on failure.
        """
        formatted_phone = self.validate_phone(phone)
        validated_amount = self.validate_amount(amount)

        token = await self.get_access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password = self.generate_password(timestamp)

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": validated_amount,
            "PartyA": formatted_phone,
            "PartyB": self.shortcode,
            "PhoneNumber": formatted_phone,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference or transaction_id,
            "TransactionDesc": "Lovely Savings Deposit",
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        logger.info(
            "STK Push → %s | phone=%s | amount=%s | ref=%s",
            url,
            formatted_phone,
            validated_amount,
            account_reference or transaction_id,
        )

        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.post(url, headers=headers, json=payload)
            except httpx.RequestError as exc:
                raise MpesaAPIError(f"Network error during STK Push: {exc}") from exc

        logger.info("STK Push response HTTP %s", resp.status_code)

        if resp.status_code != 200:
            raise MpesaAPIError(
                f"STK Push failed: HTTP {resp.status_code} — {resp.text}",
                response_data=resp.json() if resp.content else None,
            )

        data = resp.json()
        response_code = data.get("ResponseCode")

        if response_code != "0":
            error_msg = data.get("errorMessage") or data.get("ResponseDescription", "Unknown error")
            logger.error("STK Push rejected by Safaricom: %s", error_msg)
            raise MpesaAPIError(error_msg, response_data=data)

        logger.info("STK Push accepted. CheckoutRequestID=%s", data.get("CheckoutRequestID"))
        return data


# Module-level singleton — import and reuse across the app
mpesa_client = MpesaClient()
