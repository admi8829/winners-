import { Bot, webhookCallback } from "grammy";

export default {
  async fetch(request, env) {
    // BOT_TOKEN በ Cloudflare Settings -> Variables ውስጥ መኖሩን አረጋግጥ
    const bot = new Bot(env.BOT_TOKEN);

    // ተጠቃሚው /start ሲል የሚሰጠው ምላሽ
    bot.command("start", (ctx) => {
      return ctx.reply("እንኳን ደህና መጡ! ቦቱ በስኬት ተጭኗል።");
    });

    // ተጠቃሚው ማንኛውንም ጽሁፍ ሲልክ "Hello" ብሎ ይመልሳል
    bot.on("message:text", (ctx) => {
      return ctx.reply(`Hello! "${ctx.message.text}" የሚለው መልእክትህ ደርሶኛል።`);
    });

    // ቴሌግራም መልእክት ሲልክ ለ Cloudflare Worker አሳልፎ ይሰጣል
    return webhookCallback(bot, "cloudflare-workers")(request);
  },
};
