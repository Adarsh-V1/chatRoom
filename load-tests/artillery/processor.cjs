"use strict";

module.exports = { setVars };

function setVars(userContext, _events, done) {
  userContext.vars = userContext.vars || {};
  userContext.vars.chatToken = process.env.CHAT_TOKEN || "";
  userContext.vars.chatRoom = process.env.CHAT_ROOM || "general";
  userContext.vars.perfApiKey = process.env.PERF_API_KEY || "";

  if (!userContext.vars.chatToken) {
    return done(new Error("CHAT_TOKEN environment variable is required"));
  }

  return done();
}
