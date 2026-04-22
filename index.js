export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      const botToken = "8547996623:AAGkAlwfeQUK5xK--mNHSbkJgJPv7ya_8yA";
      const payload = await request.json();

      if (payload.message) {
        const chatId = payload.message.chat.id;
        const text = payload.message.text || "";
        const userId = payload.message.from.id;

        // 1. /start ሲነካ (ከሪፈራል ሊንክ ጋር ከሆነ)
        if (text.startsWith("/start")) {
          const startArgs = text.split(" ");
          let welcomeText = "እንኳን ደህና መጡ! 🚀\n\nከታች ያሉትን አማራጮች ይጠቀሙ።";
          
          if (startArgs.length > 1) {
            const referrerId = startArgs[1];
            welcomeText += `\n\nጋባዥዎ፡ ${referrerId}`;
            // እዚህ ጋር በ KV database ሪፈራል መመዝገብ ትችላለህ
          }

          await sendMessage(botToken, chatId, welcomeText, getMainButtons());
        } 
        
        // 2. Button 1: Referral Link ማውጫ
        else if (text === "🔗 የኔ ሪፈራል ሊንክ") {
          const refLink = `https://t.me/YOUR_BOT_USERNAME?start=${userId}`;
          await sendMessage(botToken, chatId, `የእርስዎ መጋበዣ ሊንክ፡\n\n${refLink}`);
        }
      }
      return new Response("OK", { status: 200 });
    }
    return new Response("Bot is running", { status: 200 });
  },
};

// ዋናዎቹን 5 በተኖች የሚያመነጭ function
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

// ሜሴጅ መላኪያ function (Anti-screenshot ተጨምሮበታል)
async def sendMessage(token, chatId, text, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: text,
    reply_markup: replyMarkup,
    // Screen Shot እንዳይደረግ የሚከለክለው (ለተወሰኑ የቴሌግራም ስሪቶች)
    protect_content: true 
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

