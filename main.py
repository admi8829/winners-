from js import Response, fetch
import json

# የቦትህን TOKEN እዚህ ተካ ወይም በ Cloudflare Settings አስገባ
TOKEN = "8547996623:AAGkAlwfeQUK5xK--mNHSbkJgJPv7ya_8yA"
API_URL = f"https://api.telegram.org/bot{TOKEN}"

async def on_fetch(request):
    if request.method == "POST":
        try:
            data = await request.json()
            if "message" in data:
                chat_id = data["message"]["chat"]["id"]
                text = data["message"].get("text", "")

                if text == "/start":
                    # መልስ ለመላክ
                    reply_text = "Hello!"
                    send_url = f"{API_URL}/sendMessage?chat_id={chat_id}&text={reply_text}"
                    await fetch(send_url)
            
            return Response.new("OK", status=200)
        except Exception as e:
            return Response.new(str(e), status=500)
            
    return Response.new("Bot is running!", status=200)

