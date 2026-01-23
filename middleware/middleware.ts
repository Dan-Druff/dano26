import { Context, Next } from "hono";
// middleware/auth.ts
  import { setCookie, getCookie, deleteCookie } from "hono/cookie"
import { DB} from "../utils/db.ts"
import { USERS } from "../utils/puckface.ts";

export const authMiddleware = async (c: Context, next: Next) => {
  const sessionId = getCookie(c, "sessionId")

  if (!sessionId) {
    return c.redirect("/login")
  }

  const session = await DB.SESSIONS.check(sessionId)

  if (!session) {
    return c.redirect("/login")
  }
  c.set("email", session.email)

  await next()
};
export const logger = async (c: Context, next: Next) => {
  const { method, url } = c.req;
  const start = Date.now();

  // Wait for the rest of the app to process the request
  await next();

  const ms = Date.now() - start;
  const status = c.res.status;

  // Simple color coding logic using standard ANSI escape codes
  const color = status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";
  const reset = "\x1b[0m";

  console.log(
    `[${new Date().toISOString()}] ${method} ${url} - ${color}${status}${reset} (${ms}ms)`
  );
};