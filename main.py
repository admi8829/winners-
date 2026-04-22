from js import Response, fetch
import json

# የቦትህን TOKEN እዚህ ጋር በትክክል አስገባ
TOKEN = "8547996623:AAGkAlwfeQUK5xK--mNHSbkJgJPv7ya_8yA"

async def on_fetch(request):
    if request.method == "POST":
        try:
            body = await request.text()
            data = json.loads(body)
            
            if "message" in data:
                chat_id = data["message"]["chat"]["id"]
                user_text = data["message"].get("text", "")

                if user_text == "/start":
                    reply = "ሰላም! ቦቱ አሁን በትክክል እየሰራ ነው 🚀"
                    send_url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
                    
                    payload = {
                        "chat_id": chat_id,
                        "text": reply
                    }
                    
                    await fetch(send_url, 
                        method="POST",
                        headers={"Content-Type": "application/json"},
                        body=json.dumps(payload)
                    )
            
            return Response.new("OK", status=200)
            
        except Exception as e:
            return Response.new(f"Error: {str(e)}", status=500)

    return Response.new("Bot is active!", status=200)
    
