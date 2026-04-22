from js import Response, fetch, Headers
import json

# የቦትህን TOKEN እዚህ ጋር በትክክል አስገባ
TOKEN = "8547996623:AAGkAlwfeQUK5xK--mNHSbkJgJPv7ya_8yA"

async def on_fetch(request):
    # 1. ቴሌግራም መረጃ ሲልክ በ POST method ነው
    if request.method == "POST":
        try:
            # ከቴሌግራም የመጣውን ዳታ ማንበብ
            body = await request.text()
            data = json.loads(body)
            
            # መረጃው ሜሴጅ መሆኑን ማረጋገጥ
            if "message" in data:
                chat_id = data["message"]["chat"]["id"]
                user_text = data["message"].get("text", "")

                # ተጠቃሚው /start ካለ ምላሽ መላክ
                if user_text == "/start":
                    reply = "ሰላም! ቦቱ በ Cloudflare Workers ላይ በተሳካ ሁኔታ እየሰራ ነው 🚀"
                    
                    send_url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
                    
                    # ለመልስ የሚሆን ዳታ ማዘጋጀት
                    payload = {
                        "chat_id": chat_id,
                        "text": reply,
                        "parse_mode": "Markdown"
                    }
                    
                    # መልሱን ወደ ቴሌግራም መላክ
                    await fetch(send_url, 
                        method="POST",
                        headers={"Content-Type": "application/json"},
                        body=json.dumps(payload)
                    )
            
            return Response.new("OK", status=200)
            
        except Exception as e:
            # ማንኛውም ስህተት ቢፈጠር ለክትትል እንዲረዳን
            print(f"Error logic: {str(e)}")
            return Response.new(f"Internal Error: {str(e)}", status=500)

    # 2. በብሮውዘር ሊንኩን ስትከፍተው የሚመጣ መልዕክት
    return Response.new("Bot is active and waiting for Telegram messages!", status=200)
        
