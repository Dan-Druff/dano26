import { Hono } from 'hono'
import { cors } from "hono/cors"; 
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { serveStatic } from 'hono/deno'

const app = new Hono()
app.use("/*", cors());
app.use("/static/*", serveStatic({ root: "./" }));
app.get('/login',(c)=>{
  return c.text("LOGIN");
})
app.get('/signup',(c)=>{
  return c.text("SIGNUP");
})
app.get('/ping',(c)=>{
  return c.text("PING");
})
app.get('/clear',(c)=>{
  return c.text("CLEAR");
})
app.get('/lobby',(c)=>{
  return c.text("LOBBY");
})
app.get('/logout',(c)=>{
  return c.text("LOGOUT");
})
app.get('/dashboard',(c)=>{
  return c.text("DASHBOARD");
})
app.get('/buyCards',(c)=>{
  return c.text("BUY CARDS");
})
app.get('/buyPucks',(c)=>{
  return c.text("BUY PUCKS");
})
app.get('/game',(c)=>{
  return c.text("GAME");
})
app.get('/createGame',(c)=>{
  return c.text("CREATE GAME");
})
app.get('/joinGame',(c)=>{
  return c.text("JOIN GAME");
})
app.get('/card',(c)=>{
  return c.text("CARD");
})
app.get('/cards',(c)=>{
  return c.text("CARDS");
})
app.get('/error',(c)=>{
  return c.text("ERROR");
})
app.get('/leagues',(c)=>{
  return c.text("LEAGUES");
})
app.get('/phl',(c)=>{
  return c.text("PHL");
})
app.get('/market',(c)=>{
  return c.text("MARKET");
})
app.get('/newCards',(c)=>{
  return c.text("NEW CARDS");
})
app.get('/offer',(c)=>{
  return c.text("OFFER");
})
app.get('/profile',(c)=>{
  return c.text("PROFILE");
})
app.get('/trade',(c)=>{
  return c.text("TRADE");
})
app.get('/sell',(c)=>{
  return c.text("SELL");
})
app.get('/', (c) => {
  return c.text('Hello MOMMY! Miss yea')
})


Deno.serve(app.fetch)
