import asyncio
import logging

from app.api.v1.api import process_all_pending_transactions

logger = logging.getLogger("app.core.tasks")

async def pending_transactions_worker(interval_seconds: int = 60) -> None:
    logger.info("Starting M-Pesa pending transaction worker, interval=%s seconds", interval_seconds)
    while True:
        try:
            processed = await asyncio.to_thread(process_all_pending_transactions)
            logger.info("Processed %s pending M-Pesa transaction(s)", processed)
        except Exception as exc:
            logger.exception("Error while processing pending M-Pesa transactions: %s", exc)
        await asyncio.sleep(interval_seconds)


if __name__ == "__main__":
    asyncio.run(pending_transactions_worker())
