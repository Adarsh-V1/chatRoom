/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as calls from "../calls.js";
import type * as chats from "../chats.js";
import type * as lib_password from "../lib/password.js";
import type * as lib_session from "../lib/session.js";
import type * as priorities from "../priorities.js";
import type * as settings from "../settings.js";
import type * as unread from "../unread.js";
import type * as users from "../users.js";
import type * as webrtc from "../webrtc.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  calls: typeof calls;
  chats: typeof chats;
  "lib/password": typeof lib_password;
  "lib/session": typeof lib_session;
  priorities: typeof priorities;
  settings: typeof settings;
  unread: typeof unread;
  users: typeof users;
  webrtc: typeof webrtc;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
