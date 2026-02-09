import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

  args: { message: v.string(), username: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert('chats', { message: args.message, username: args.username, room: args.room })
  }
})


  args: { room: v.string() },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query('chats')
      .filter(q => q.eq(q.field('room'), args.room))
      .collect()
    return chats
  }
})