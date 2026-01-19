import { Hono } from 'hono'
import { cors } from "hono/cors"; 
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { serveStatic } from 'hono/deno'

const app = new Hono()
app.use("/*", cors());
app.use("/static/*", serveStatic({ root: "./" }));

app.get('/', (c) => {
  return c.text('Hello MOMMY! Miss yea')
})

Deno.serve(app.fetch)
