export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      try {
        const botToken = env.BOT_TOKEN || "8547996623:AAGkAlwfeQUK5xK--mNHSbkJgJPv7ya_8yA";
        const payload = await request.json();

        if (payload.message) {
          const chatId = payload.message.chat.id;
          const text = payload.message.text || "";
          const userId = payload.message.from.id;

          if (text.startsWith("/start")) {
            const startArgs = text.split(" ");
            let welcomeText = "እንኳን ደህና መጡ! 🚀\n\nከታች ያሉትን አማራጮች ይጠቀሙ።";
            if (startArgs.length > 1) {
              welcomeText += `\n\nጋባዥዎ ID: ${startArgs[1]}`;
            }
            await sendMessage(botToken, chatId, welcomeText, getMainButtons());
          } 
          else if (text === "🔗 የኔ ሪፈራል ሊንክ") {
            const botUser = env.BOT_USERNAME || "YourBotName";
            const refLink = `https://t.me/${botUser}?start=${userId}`;
            await sendMessage(botToken, chatId, `የእርስዎ መጋበዣ ሊንክ፡\n\n${refLink}`);
          }
        }
      } catch (e) {
        return new Response("OK", { status: 200 });
      }
      return new Response("OK", { status: 200 });
    }
    return new Response("Bot is running", { status: 200 });
  },
};

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

async function sendMessage(token, chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      reply_markup: replyMarkup,
      protect_content: true
    }),
  });
  return response;
        
