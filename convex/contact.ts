import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const subject = (args.subject ?? "").trim();
    const message = args.message.trim();
    const source = (args.source ?? "landing-page").trim() || "landing-page";

    if (name.length < 2) {
      throw new ConvexError("Please enter your name");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ConvexError("Please enter a valid email address");
    }

    if (message.length < 12) {
      throw new ConvexError("Please add a little more detail to your message");
    }

    await ctx.db.insert("contactSubmissions", {
      name,
      email,
      emailLower: email,
      subject: subject || undefined,
      message,
      source,
      createdAt: Date.now(),
      status: "new",
    });

    return { ok: true };
  },
});
