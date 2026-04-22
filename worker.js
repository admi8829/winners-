export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      try {
        const payload = await request.json();
        
        if (payload.message) {
          const chatId = payload.message.chat.id;
          const text = payload.message.text || "";
          const userId = payload.message.from.id;

          // 1. /start ሲላክ
          if (text.startsWith("/start")) {
            const startArgs = text.split(" ");
            let welcome = "እንኳን ደህና መጡ! 🚀\n\nይህ ቦት በ Cloudflare ላይ የተሰራ ነው።";
            
            if (startArgs.length > 1) {
              welcome += `\n\nጋባዥዎ ID: ${startArgs[1]}`;
            }
            await sendMessage(env.BOT_TOKEN, chatId, welcome, getMainButtons());
          } 
          
          // 2. Button handle
          else if (text === "🔗 የኔ ሪፈራል ሊንክ") {
            const refLink = `https://t.me/${env.BOT_USERNAME}?start=${userId}`;
            await sendMessage(env.BOT_TOKEN, chatId, `የእርስዎ መጋበዣ ሊንክ፡\n\n${refLink}`);
          }
        }
      } catch (e) {
        return new Response("OK", { status: 200 });
      }
      return new Response("OK", { status: 200 });
    }
    return new Response("Bot is running", { status: 200 });
  }
};

// 5 Buttons Function
function getMainButtons() {
  return JSON.stringify({
    keyboard: [
      [{ text: "🔗 የኔ ሪፈራል ሊንክ" }, { text: "💰 ባላንስ" }],
      [{ text: "🏆 መሪዎች" }, { text: "📊 ስታቲስቲክስ" }],
      [{ text: "⚙️ Settings" }]
    ],
    resize_keyboard: true
  });
}

// Send Message Function (JavaScript Version)
async function sendMessage(token, chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      reply_markup: replyMarkup,
      protect_content: true // ስክሪንሾት ለመከልከል
    })
  });
                                   }
  
