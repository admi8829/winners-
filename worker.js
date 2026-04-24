import { Bot, session, InlineKeyboard, Keyboard, webhookCallback } from "grammy";

export default {
  async fetch(request, env) {
    const bot = new Bot(env.BOT_TOKEN);

    // 1. Session Setup (ለ State Management)
    bot.use(session({
      initial: () => ({ step: "idle" }),
    }));

    // --- Helpers ---
    const isMember = async (userId) => {
      try {
        const member = await bot.api.getChatMember(env.CHANNEL_ID, userId);
        return ["member", "administrator", "creator"].includes(member.status);
      } catch { return false; }
    };

    const getUser = async (userId) => {
      return await env.DB.prepare("SELECT * FROM users WHERE user_id = ?").bind(userId).first();
    };

    const getMainMenu = (lang) => {
      const k = new Keyboard();
      if (lang === "am") {
        k.text("➕ አዲስ ትኬት ቁረጥ").row().text("👤 የእኔ መረጃ").text("🎁 አሸናፊዎች").row().text("👥 ጓደኛ ጋብዝ").text("💡 እገዛ").row().text("🌐 Language");
      } else {
        k.text("➕ Buy Ticket").row().text("👤 My Info").text("🎁 Winners").row().text("👥 Invite").text("💡 Help").row().text("🌐 ቋንቋ");
      }
      return k.resized();
    };

    // --- Start Command ---
    bot.command("start", async (ctx) => {
      const userId = ctx.from.id;
      const user = await getUser(userId);

      if (!user) {
        await env.DB.prepare(
          "INSERT INTO users (user_id, full_name, username, lang) VALUES (?, ?, ?, 'am')"
        ).bind(userId, ctx.from.first_name, ctx.from.username).run();
      }

      if (!user?.phone) {
        ctx.session.step = "waiting_for_phone";
        return ctx.reply("እንኳን ወደ ሎተሪ ቦት መጡ! ለመመዝገብ ስልክዎን ያጋሩ።", {
          reply_markup: new Keyboard().requestContact("📲 ስልክ ቁጥር አጋራ").resized().oneTime()
        });
      }

      const joined = await isMember(userId);
      if (!joined) {
        const kb = new InlineKeyboard().url("📢 ቻናሉን ተቀላቀል", "https://t.me/ethiouh").row().callback("✅ አረጋግጥ", "check_join");
        return ctx.reply("እባክዎ መጀመሪያ የቴሌግራም ቻናላችንን ይቀላቀሉ!", { reply_markup: kb });
      }

      await ctx.reply("እንኳን ተመለሱ!", { reply_markup: getMainMenu(user.lang) });
    });

    // --- Contact Handler ---
    bot.on("message:contact", async (ctx) => {
      if (ctx.session.step !== "waiting_for_phone") return;
      const userId = ctx.from.id;
      const phone = ctx.contact.phone_number;
      
      await env.DB.prepare("UPDATE users SET phone = ? WHERE user_id = ?").bind(phone, userId).run();
      ctx.session.step = "idle";
      
      const kb = new InlineKeyboard().url("📢 ቻናሉን ተቀላቀል", "https://t.me/ethiouh").row().callback("✅ አረጋግጥ", "check_join");
      await ctx.reply("ምዝገባው ተጠናቅቋል! አሁን ቻናሉን ተቀላቅለው አረጋግጥን ይጫኑ።", { reply_markup: kb });
    });

    // --- Photo/Receipt Handler ---
    bot.on("message:photo", async (ctx) => {
      const userId = ctx.from.id;
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

      await bot.api.sendPhoto(env.ADMIN_ID, photoId, {
        caption: `📥 አዲስ የክፍያ ደረሰኝ\nከ: ${ctx.from.first_name}\nID: ${userId}`,
        reply_markup: new InlineKeyboard()
          .callback("✅ አጽድቅ", `approve_${userId}`)
          .callback("❌ ሰርዝ", `reject_${userId}`)
      });

      await ctx.reply("ደረሰኝዎ ለባለሙያ ተልኳል! በቅርቡ ይረጋገጥልዎታል።");
    });

    // --- Callback Queries ---
    bot.on("callback_query:data", async (ctx) => {
      const data = ctx.callbackQuery.data;
      const userId = ctx.from.id;

      if (data === "check_join") {
        if (await isMember(userId)) {
          const user = await getUser(userId);
          await ctx.answerCallbackQuery("ተረጋግጧል!");
          await ctx.editMessageText("እንኳን ደህና መጡ! ትኬት ለመቁረጥ 'አዲስ ትኬት' የሚለውን ይጫኑ።", { reply_markup: getMainMenu(user.lang) });
        } else {
          await ctx.answerCallbackQuery({ text: "እባክዎ መጀመሪያ ቻናሉን ይቀላቀሉ!", show_alert: true });
        }
      }

      if (data.startsWith("approve_") && userId == env.ADMIN_ID) {
        const targetId = data.split("_")[1];
        const ticketNo = "ET-" + Math.floor(100000 + Math.random() * 900000);
        await env.DB.prepare("INSERT INTO tickets (user_id, ticket_number, status) VALUES (?, ?, 'approved')").bind(targetId, ticketNo).run();
        await bot.api.sendMessage(targetId, `🎉 እንኳን ደስ አለዎት! ክፍያዎ ጸድቋል።\nየሎተሪ ትኬት ቁጥርዎ፡ ${ticketNo}`);
        await ctx.editMessageCaption({ caption: `✅ ጸድቋል: ${ticketNo}` });
      }

      if (data === "set_lang") {
        const user = await getUser(userId);
        const newLang = user.lang === "am" ? "en" : "am";
        await env.DB.prepare("UPDATE users SET lang = ? WHERE user_id = ?").bind(newLang, userId).run();
        await ctx.reply(newLang === "am" ? "ቋንቋ ተቀይሯል" : "Language Changed", { reply_markup: getMainMenu(newLang) });
        await ctx.answerCallbackQuery();
      }
    });

    // --- Text Menu Handlers ---
    bot.on("message:text", async (ctx) => {
      const text = ctx.message.text;
      const userId = ctx.from.id;
      const user = await getUser(userId);

      if (text.includes("አዲስ ትኬት") || text.includes("Buy Ticket")) {
        await ctx.reply("💳 የክፍያ መመሪያ\n\nበቴሌብር (0911XXXXXX) 50 ብር ይላኩ።\nከከፈሉ በኋላ የክፍያውን ደረሰኝ (Screenshot) እዚህ ይላኩ።");
      } else if (text.includes("መረጃ") || text.includes("My Info")) {
        const tickets = await env.DB.prepare("SELECT COUNT(*) as count FROM tickets WHERE user_id = ? AND status = 'approved'").bind(userId).first();
        const msg = user.lang === "am" 
          ? `👤 ስም: ${user.full_name}\n📱 ስልክ: ${user.phone}\n🎟 ትኬቶች: ${tickets.count}`
          : `👤 Name: ${user.full_name}\n📱 Phone: ${user.phone}\n🎟 Tickets: ${tickets.count}`;
        await ctx.reply(msg);
      } else if (text.includes("Language") || text.includes("ቋንቋ")) {
        await ctx.reply("ቋንቋ ለመቀየር / Change Language", {
          reply_markup: new InlineKeyboard().callback("ቀይር / Change", "set_lang")
        });
      }
    });

    return webhookCallback(bot, "cloudflare-workers")(request);
  }
};
        
