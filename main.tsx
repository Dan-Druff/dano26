import { Hono } from 'hono'
import { cors } from "hono/cors"; 
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { serveStatic } from 'hono/deno'
import { Layout } from "./components/Layout.tsx";
import { authMiddleware, logger } from "./middleware/middleware.ts";
import { LoginPage, SignupPage } from "./routes/Login.tsx";
import api from "./utils/api.tsx";
import { DB } from "./utils/db.ts";
import { DBUserData } from "./utils/consts.ts";
import { DashboardPage } from "./routes/Dashboard.tsx";
import { HELPERS, NHL } from "./utils/puckface.ts";
import { NHLGame } from "./components/NHLGame.tsx";
const app = new Hono()
app.use("/*", cors());
app.use("/static/*", serveStatic({ root: "./" }));
app.use("*", logger);
app.route("/api",api);
app.get('/login',(c)=>{
  return c.html(<LoginPage></LoginPage>)
})
app.get('/signup',(c)=>{
  return c.html(<SignupPage></SignupPage>)
})
app.get('/ping',async(c)=>{
  const listall = await DB.getAllDataAsHtml()
  return c.html(listall);
})
app.get('/clear',async(c)=>{
  await DB.clearAllData() 
  return c.text("DATA CLEARED");
})
app.get('/lobby',(c)=>{
  return c.text("LOBBY");
})
app.get('/logout',async(c)=>{
    // 1️⃣ Get the session cookie
  const sessionId = getCookie(c, "sessionId")

  // 2️⃣ Delete the session in KV if it exists
  if (sessionId) {
    await DB.SESSIONS.delete(sessionId) // or kv.delete(["sessions", sessionId])
  }

  // 3️⃣ Delete the cookie in the browser
  deleteCookie(c, "sessionId", {
    path: "/",       // important: match the cookie path
    httpOnly: true,  // match what you set on login
    secure: true,    // optional: match login config
    sameSite: "Lax", // optional
  })

  // 4️⃣ Redirect to login page (or homepage)
  return c.redirect("/")
})
app.get('/dashboard',authMiddleware,async(c)=>{
  
  const u = c.get("email")
  const udata = await DB.read("users",u) as DBUserData | null;
  if(!udata){console.log(`Got an error here`)}
  const r = JSON.stringify(udata,null,2)
  console.log(`DASHBAORD EMAIL IS: ${u}`)
  if(udata){
  return c.html(
    <DashboardPage email={u} userData={udata}></DashboardPage>
    );
  }

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
app.get('/predict',async(c)=>{
    const g = await NHL.getNhlGamesWithRecords(HELPERS.getPFDateFromDate(new Date).apiString)

   return c.html(
    <Layout>
      <div class="games">
      {g.map((game)=>{
        return (
          <NHLGame game={game}></NHLGame>
        )
      })}
      
    </div>
    </Layout>)
})
app.get('/', (c) => {

  return c.html(
    <Layout>
      <h2>HOME PAGE</h2>
    </Layout>)
})


Deno.serve(app.fetch)
