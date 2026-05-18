"""
Background tasks for the app.

The pending-transaction polling worker has been replaced by the
GET /mpesa/stk-status/{checkout_request_id} endpoint — the frontend polls
for the result directly. This module is retained for future background tasks.
"""
