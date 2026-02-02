import { Hono } from "hono";
import { cors } from "hono/cors";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { serveStatic } from "hono/deno";
import { Layout } from "./components/Layout.tsx";
import { authMiddleware, logger } from "./middleware/middleware.ts";
import { LoginPage, SignupPage } from "./routes/Login.tsx";
import api from "./utils/api.tsx";
import { DB } from "./utils/db.ts";
import { DBUserData, PFTx, errorMessages } from "./utils/consts.ts";
import { DashboardPage } from "./routes/Dashboard.tsx";
import { HELPERS, NHL } from "./utils/puckface.ts";
import { NHLGame } from "./components/NHLGame.tsx";
import { PredictorPage } from "./routes/Predictor.tsx";
import { MarketPage } from "./routes/Market.tsx";
import { BuyPuckPage } from "./routes/BuyPucks.tsx";
import { BuyCardPage } from "./routes/BuyCards.tsx";
import { ErrorPage } from "./routes/Error.tsx";
import { ProfilePage } from "./routes/Profile.tsx";
import { NewCardsPage } from "./routes/NewCards.tsx";
import { CardsPage } from "./routes/Cards.tsx";
import { CardPage } from "./routes/Card.tsx";
const app = new Hono();
app.use("/*", cors());
app.use("/static/*", serveStatic({ root: "./" }));
app.use("*", logger);
app.route("/api", api);
app.get("/login", (c) => {
  const errorKey = c.req.query('error');
  const savedEmail = c.req.query('email');
  const message = errorKey ? (errorMessages[errorKey] || errorMessages.default) : undefined;

  return c.html(<LoginPage email={savedEmail} error={message}></LoginPage>);
});
app.get("/signup", (c) => {
    const errorKey = c.req.query('error');
  const savedEmail = c.req.query('email');
  const message = errorKey ? (errorMessages[errorKey] || errorMessages.default) : undefined;

  return c.html(<SignupPage email={savedEmail} error={message}></SignupPage>);
});
app.get("/ping", async (c) => {
  const listall = await DB.getAllDataAsHtml();
  return c.html(listall);
});
app.get("/clear", async (c) => {
  await DB.clearAllData();
  return c.text("DATA CLEARED");
});
app.get("/lobby", (c) => {
  return c.text("LOBBY");
});
app.get("/logout", async (c) => {
  // 1️⃣ Get the session cookie
  const sessionId = getCookie(c, "sessionId");

  // 2️⃣ Delete the session in KV if it exists
  if (sessionId) {
    await DB.SESSIONS.delete(sessionId); // or kv.delete(["sessions", sessionId])
  }

  // 3️⃣ Delete the cookie in the browser
  deleteCookie(c, "sessionId", {
    path: "/", // important: match the cookie path
    httpOnly: true, // match what you set on login
    secure: true, // optional: match login config
    sameSite: "Lax", // optional
  });

  // 4️⃣ Redirect to login page (or homepage)
  return c.redirect("/");
});
app.get("/dashboard", authMiddleware, async (c) => {
  try {
    const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
    if (!udata) throw new Error(`🚦Couldnt get userdata. 🚦`);
    return c.html(
      <DashboardPage email={u} userData={udata}></DashboardPage>,
    );
  } catch (error) {
    console.log(`🚦Something went wrong on the dashboard.🚦 ${error}`);
    return c.html(
      <ErrorPage message={`Dashboard Error: ${error}`}></ErrorPage>,
    );
  }
});
app.get("/buyCards", authMiddleware, async (c) => {
  try {
    const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
    if (!udata) throw new Error(`🚦Couldnt get userdata🚦`);
    return c.html(<BuyCardPage email={u} userData={udata}></BuyCardPage>);
  } catch (error) {
    console.log(`Error buyiung cards: ${error}`);
    return c.html(
      <ErrorPage message={`Error buyiung cards: ${error}`}></ErrorPage>,
    );
  }
});
app.get("/buyPucks", authMiddleware, async (c) => {
  try {
    const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
    if (!udata) throw new Error(`🚦Couldnt get userdata🚦`);
    return c.html(<BuyPuckPage email={u} userData={udata}></BuyPuckPage>);
  } catch (error) {
    console.log(`🚦COuldnt buy pucks ${error}🚦`);
    return c.html(
      <ErrorPage message={`🚦COuldnt buy pucks ${error}🚦`}></ErrorPage>,
    );
  }
});
app.get("/game", (c) => {
  return c.text("GAME");
});
app.get("/createGame", (c) => {
  return c.text("CREATE GAME");
});
app.get("/joinGame", (c) => {
  return c.text("JOIN GAME");
});
app.get("/card/:id",authMiddleware, async(c) => {
  try {

      const cardID = c.req.param('id');
      const u = c.get("email");
      const udata = await DB.read("users", u) as DBUserData | null;
      console.log(`id:${cardID} user:${u} udata:${udata}`)
      if(!u || !udata || !cardID){throw new Error(`Couldnt get required info`)}
      return c.html(<CardPage card={cardID} email={u} userData={udata}></CardPage>)
  } catch (error) {
      console.log(`Something went wrong getting card ${error}`)
      return c.redirect('/error')
  }

});
app.get("/cards", authMiddleware,async(c) => {
     const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
  return c.html(<CardsPage email={u} userData={udata}></CardsPage>)
});
app.get("/error", (c) => {
    const errorKey = c.req.query('error');
    const message = errorKey ? (errorMessages[errorKey] || errorMessages.default) : undefined;
    return c.html(<ErrorPage message={`🚦 ${message} 🚦`}></ErrorPage>);
});
app.get("/leagues", (c) => {
  return c.text("LEAGUES");
});
app.get("/phl", (c) => {
  return c.text("PHL");
});
app.get("/market", authMiddleware, async (c) => {
  try {
    const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
    if (!udata) throw new Error(`🚦Couldnt get userdata🚦`);
    return c.html(<MarketPage userData={udata} email={u}></MarketPage>);
  } catch (error) {
    console.log(`🚦Error on market page? ${error}🚦`);
    return c.html(
      <ErrorPage message={`🚦Error on market page? ${error}🚦`}></ErrorPage>,
    );
  }
});
app.get("/newCards", authMiddleware,async(c) => {
    try {
    const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
    const logs = await DB.read('logs',u) as {all:PFTx[]} | null;
    if (!udata || !logs) throw new Error(`🚦Couldnt get userdata or logs🚦`);
    const tx = logs.all.at(-1)
    if (!tx) throw new Error(`🚦Couldnt get TX🚦`);
    const cards = tx.cards;
    return c.html(<NewCardsPage userData={udata} email={u} cards={cards}></NewCardsPage>);
  } catch (error) {
    console.log(`🚦Error on market page? ${error}🚦`);
    return c.html(
      <ErrorPage message={`🚦Error on market page? ${error}🚦`}></ErrorPage>,
    );
  }

});
app.get("/offer", (c) => {
  return c.text("OFFER");
});
app.get("/profile",authMiddleware, async(c) => {
   try {
    const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
    if (!udata) throw new Error(`🚦Couldnt get userdata🚦`);
    return c.html(<ProfilePage userData={udata} email={u}></ProfilePage>);
  } catch (error) {
    console.log(`🚦Error on market page? ${error}🚦`);
    return c.html(
      <ErrorPage message={`🚦Error on market page? ${error}🚦`}></ErrorPage>,
    );
  }
});
app.get("/trade", (c) => {
  return c.text("TRADE");
});
app.get("/sell", (c) => {
  return c.text("SELL");
});
app.get("/predict", authMiddleware, async (c) => {
  // check to see if theres predictions to calculate
  // show stats
  // if todays picks have been submitted, show them
  try {
    const u = c.get("email");
    const udata = await DB.read("users", u) as DBUserData | null;
    if (!udata) throw new Error(`🚦 Couldnt get userdata 🚦`);
    return c.html(<PredictorPage email={u} userData={udata}></PredictorPage>);
  } catch (error) {
    console.log(`🚦Error on prediction page🚦`);
    return c.html(
      <ErrorPage message={`🚦Error on prediction page🚦`}></ErrorPage>,
    );
  }
});
app.get("/", (c) => {
  return c.html(
    <Layout>
      <h2>HOME PAGE</h2>
    </Layout>,
  );
});

Deno.serve(app.fetch);
