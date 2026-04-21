from js import Response, fetch
import json

# የቦትህን TOKEN እዚህ መተካትህን አረጋግጥ
TOKEN = "8547996623:AAGkAlwfeQUK5xK--mNHSbkJgJPv7ya_8yA"

async def on_fetch(request):
    if request.method == "POST":
        try:
            body = await request.text()
            data = json.loads(body)
            
            if "message" in data:
                chat_id = data["message"]["chat"]["id"]
                text = data["message"].get("text", "")

                if text == "/start":
                    send_url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
                    payload = {
                        "chat_id": chat_id,
                        "text": "Hello! I am running on Cloudflare Workers."
                    }
                    
                    await fetch(send_url, method="POST", 
                               headers={"Content-Type": "application/json"},
                               body=json.dumps(payload))
            
            return Response.new("OK", status=200)
        except Exception as e:
            # ስህተቱን በሎግ ላይ ለማየት
            print(f"Error: {str(e)}")
            return Response.new("Error occurred", status=500)
            
    return Response.new("Bot is active!", status=200)
                    
