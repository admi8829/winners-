export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      try {
        const update = await request.json();

        // ሜሴጅ መኖሩን እና ጽሁፍ መሆኑን ቼክ ያደርጋል
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const botToken = env.BOT_TOKEN; // Environment variable

          // ወደ ቴሌግራም API መልስ መላክ
          const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
          
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "hello",
            }),
          });
        }
      } catch (e) {
        return new Response("Error: " + e.message, { status: 500 });
      }
    }
    
    return new Response("Bot is running!", { status: 200 });
  },
};
              
