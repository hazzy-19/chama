import httpx
import asyncio
import json

async def simulate_reply(reply_text: str):
    url = "http://127.0.0.1:8000/api/v1/whatsapp/webhook"
    payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "16505551111",
                                "phone_number_id": "123456123"
                            },
                            "messages": [
                                {
                                    "from": "16315551181",
                                    "id": "wamid.HBgLMTYzMTU1NTExODEVAgASGCJ",
                                    "timestamp": "1603059201",
                                    "text": {
                                        "body": reply_text
                                    },
                                    "type": "text"
                                }
                            ]
                        },
                        "field": "messages"
                    }
                ]
            }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Sending '{reply_text}' to webhook...")
            res = await client.post(url, json=payload, timeout=5)
            print(f"Response ({res.status_code}): {res.json()}")
        except Exception as e:
            print(f"Failed to send request: {e}")

if __name__ == "__main__":
    import sys
    reply = sys.argv[1] if len(sys.argv) > 1 else "yes"
    asyncio.run(simulate_reply(reply))
