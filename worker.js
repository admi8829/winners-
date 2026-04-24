import { Bot, session, InlineKeyboard, Keyboard, webhookCallback } from "grammy";
import { createClient } from "@supabase/supabase-js";
import { freeStorage } from "@grammyjs/storage-free"; // Cloudflare KV ለ ነፃ storage

export default {
  async fetch(request, env) {
    const bot = new Bot(env.BOT_TOKEN);
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

    // 1. Session Setup (ለ State Management)
    bot.use(session({
      initial: () => ({ step: "idle", lang: "en" }),
    }));

    // --- Helpers ---
    const isMember = async (userId) => {
      try {
        const member = await bot.api.getChatMember(env.CHANNEL_ID, userId);
        return ["member", "administrator", "creator"].includes(member.status);
      } catch { return false; }
    };

    const getMainMenu = (lang) => {
      const k = new Keyboard();
      if (lang === "am") {
        k.text("➕ አዲስ ትኬት ቁረጥ").row().text("👤 የእኔ መረጃ").text("🎁 አሸናፊዎች").row().text("👥 ጓደኛ ጋብዝ").text("💡 እገዛ").row().text("🌐 ቋንቋ");
      } else {
        k.text("➕ Buy New Ticket").row().text("👤 My Info").text("🎁 Winners").row().text("👥 Invite Friends").text("💡 Help").row().text("🌐 Language");
      }
      return k.resized();
    };

    // --- Handlers ---

    // /start Command
    bot.command("start", async (ctx) => {
      const userId = ctx.from.id;
      const refId = ctx.match; // ለሪፈራል

      const { data: user } = await supabase.from("users").select("*").eq("user_id", userId).single();
      
      if (!user) {
        await supabase.from("users").insert({
          user_id: userId,
          full_name: ctx.from.first_name,
          username: ctx.from.username,
          referred_by: refId && refId != userId ? refId : null,
          lang: "en"
        });
      }

      if (user?.phone) {
        const joined = await isMember(userId);
        if (joined) {
          return ctx.reply(`Welcome back ${ctx.from.first_name}!`, { reply_markup: getMainMenu(user.lang) });
        }
      }

      ctx.session.step = "waiting_for_phone";
      await ctx.reply(`Hello ${ctx.from.first_name}! Please share your contact to register.`, {
        reply_markup: new Keyboard().requestContact("📲 Share Contact").resized().oneTime()
      });
    });

    // ስልክ ቁጥር መቀበያ
    bot.on("message:contact", async (ctx) => {
      if (ctx.session.step !== "waiting_for_phone") return;
      const userId = ctx.from.id;
      const phone = ctx.contact.phone_number;

      await supabase.from("users").update({ phone }).eq("user_id", userId);
      ctx.session.step = "idle";
      
      const kb = new InlineKeyboard()
        .url("📢 Join Channel", "https://t.me/ethiouh").row()
        .callback("🔄 Verify", "check_join");

      await ctx.reply("✅ Registered! Now join our channel to continue.", { reply_markup: kb });
    });

    // የክፍያ ደረሰኝ መቀበያ (Photo)
    bot.on("message:photo", async (ctx) => {
      const userId = ctx.from.id;
      const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

      // ለአድሚን መላክ
      await bot.api.sendPhoto(env.ADMIN_ID, photoId, {
        caption: `📥 New Receipt\nFrom: ${ctx.from.first_name}\nID: ${userId}`,
        reply_markup: new InlineKeyboard()
          .callback("✅ Approve", `approve_${userId}`)
          .callback("❌ Reject", `reject_${userId}`)
      });

      await ctx.reply("✅ Receipt sent! Admin will verify soon.");
    });

    // Callback Query Handling (Approve/Reject/Verify)
    bot.on("callback_query:data", async (ctx) => {
      const data = ctx.callbackQuery.data;
      const userId = ctx.from.id;

      if (data === "check_join") {
        const joined = await isMember(userId);
        if (joined) {
          await ctx.answerCallbackQuery("Verified!");
          await ctx.editMessageText("Welcome! Use the menu below.", { reply_markup: getMainMenu("en") });
        } else {
          await ctx.answerCallbackQuery({ text: "Please join the channel first!", show_alert: true });
        }
      }

      if (data.startsWith("approve_") && userId == env.ADMIN_ID) {
        const targetId = data.split("_")[1];
        const ticketNo = `LOT-${Math.floor(100000 + Math.random() * 900000)}`;
        
        await supabase.from("tickets").insert({ user_id: targetId, ticket_number: ticketNo, status: "approved" });
        await bot.api.sendMessage(targetId, `🎉 Approved! Your Ticket: ${ticketNo}`);
        await ctx.editMessageCaption({ caption: `✅ Approved: ${ticketNo}` });
      }

      if (data === "set_am" || data === "set_en") {
        const lang = data.split("_")[1];
        await supabase.from("users").update({ lang }).eq("user_id", userId);
        await ctx.deleteMessage();
        await ctx.reply(lang === "am" ? "ቋንቋ ተቀይሯል" : "Language Set!", { reply_markup: getMainMenu(lang) });
      }
    });

    // ሜኑዎችን ማስተናገድ
    bot.on("message:text", async (ctx) => {
      const text = ctx.message.text;
      const userId = ctx.from.id;

      if (text.includes("አዲስ ትኬት") || text.includes("Buy New Ticket")) {
        const kb = new InlineKeyboard().callback("💳 Pay via Telebirr", "show_payment");
        await ctx.reply("Ticket Price: 50 ETB\nSend to: 09XXXXXXXX (Habtamu)", { reply_markup: kb });
      }

      if (text.includes("ቋንቋ") || text.includes("Language")) {
        const kb = new InlineKeyboard().callback("አማርኛ 🇪🇹", "set_am").callback("English 🇺🇸", "set_en");
        await ctx.reply("Choose Language / ቋንቋ ይምረጡ", { reply_markup: kb });
      }
      
      // ሌሎች ሜኑዎች (My Info, Winners...) እዚህ ላይ በተመሳሳይ Logic ይጨመራሉ
    });

    // Webhook setup
    return webhookCallback(bot, "cloudflare-workers")(request);
  }
};
      
