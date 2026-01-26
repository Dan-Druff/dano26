import { Hono } from "hono";
import { DB } from "./db.ts";
import argon2 from 'argon2'
import { LoginPage,SignupPage } from "../routes/Login.tsx";
import { DBUserData, User } from "./consts.ts";
import { HELPERS, USERS } from "./puckface.ts";
import { setCookie, getCookie, deleteCookie } from "hono/cookie"
import { authMiddleware } from "../middleware/middleware.ts";

export async function hashPassword(password: string) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // ~19 MB
    timeCost: 2,
    parallelism: 1,
  })
}
export async function verifyPassword(
  hash: string,
  password: string
) {
  return await argon2.verify(hash, password)
}
const api = new Hono()

api.post('/login', async(c) => {
    try {
        const form = await c.req.formData();
        const email = form.get("email");
        const password = form.get("password");
        if(typeof email !== "string" || typeof password !== "string"){
          if(typeof email === "string"){
            return c.html(<SignupPage email={email} error="Invalid Form Data"/>)
          }else{
            return c.html(<SignupPage email="you@email.com" error="Invalid Form Data"/>)
          }
        
        }
        const ud = await DB.read("userAuth",email)
        if(!ud){
          return c.html(<LoginPage email={email} error="Something went wrong"/>)
        }
        const v = await verifyPassword(ud.hashedPassword,password)
        if(!v){
          return c.html(<LoginPage email={email} error="Something went wrong. Try again..."/>)
        }
        console.log(`Password is ${v}`)
        const sessionId = crypto.randomUUID()
        const s = await DB.SESSIONS.create(sessionId,email)
        if(!s){
          return c.html(<LoginPage email={email} error="Something went wrong. Try again..."/>)
        }
          setCookie(c, "sessionId", sessionId, {
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 2,
        })
        return c.redirect('/dashboard')
    } catch (error) {
        console.log(`Error On Login ${error}`)
    }
 


}) 
api.post('/signup', async(c) => {

    try {
        const form = await c.req.formData();
        const email = form.get("email");
        const password1 = form.get("password1");
        const password2 = form.get("password2")
        if(typeof email !== "string" || typeof password1 !== "string" || typeof password2 !== "string"){
          if(typeof email === "string"){
            return c.html(<SignupPage email={email} error="Invalid Form Data"/>)
          }else{
            return c.html(<SignupPage email="Something Went Wrong" error="Invalid Form Data"/>)
          }
          
        }
        if(password1 !== password2){
          return c.html(<SignupPage email={email} error="Passwords do not match"/>)
        }
        const h1 = await hashPassword(password1);
   
        const uid = await HELPERS.emailUID(email)
        const u :User = {email:email,id:uid,createdAt:HELPERS.getPFDateFromDate(new Date).fullDate,hashedPassword:h1}
        const setuser = await DB.create("userAuth",email,u)
        const uData = await USERS.signup(email)
        const sessionId = crypto.randomUUID()
        const session = await DB.SESSIONS.create(sessionId,email)
        if(!session){
          return c.html(<SignupPage email={email} error="Couldnt Create A session"/>)
        }
        setCookie(c, "sessionId", sessionId, {
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 2,
        })

        console.log(email,password1)
  
       
        
        return c.redirect('/dashboard')
    } catch (error) {
        console.log(`Error on api signup ${error}`)
     
        return c.text(`Error on api signup ${error}`)
    }




  
})
api.get('/check-picks',authMiddleware,async(c)=>{
  try {
    const email = c.get("email")
    const uid = await HELPERS.emailUID(email);
    const d = "2026-01-25"
    const pix = await DB.read(`predictions-${uid}`,d);
    const usersStats = await DB.read(`predictions-${uid}`,'stats') as {wins:number,losses:number,winningDays:number,losingDays:number} | null;
    if(!pix || !usersStats){throw new Error('🚦COuldnt get data🚦')};
    const stats = {correct:0,incorrect:0}
    const gameIds = [];
    for (const [key, value] of Object.entries(pix)) {
      console.log(typeof key); // "string"
      console.log(key);        // "game_2025020819"
      const gameId = key.split("_")[1]; 
      gameIds.push({id:gameId,pick:value})
    }
    const calcedGames = await Promise.all(gameIds.map(async(gid)=>{
      const getGame = await fetch(`https://api-web.nhle.com/v1/gamecenter/${gid.id}/landing`);
      if (!getGame.ok) {throw new Error("🚦Failed to fetch NHL scoreboard data🚦")}
      const gameData = await getGame.json();
      // const gameIsFuture = gameData.gameState === "FUT" ? true : false;
      // const gameIsOver = gameData.gameState === "OFF" ? true : false;
      console.log(`Game: ${gameData.id}. Home:${gameData.homeTeam.abbrev} ${gameData.homeTeam.score} Away: ${gameData.awayTeam.abbrev} ${gameData.awayTeam.score}`)
      const homeAbb = gameData.homeTeam.abbrev;
      const awayAbb = gameData.awayTeam.abbrev;
      const winner = gameData.homeTeam.score > gameData.awayTeam.score ? homeAbb : awayAbb;
      console.log(`Winner is: ${winner}`)
      console.log(`You picked ${gid.pick}`)
      if(winner === gid.pick){
        console.log(`You picked correctly`)
        stats.correct++;
      }else{
        stats.incorrect++;
        console.log(`You picked INcorrectly`)
      }

      console.log(`Game: ${gameData.id}. Home: ${gameData.homeTeam.score} Away:${gameData.awayTeam.score}`);
      return {id:gid.id,pick:gid.pick,winner:winner}
    }))
    const newUsersStats = {wins:usersStats.wins + stats.correct,losses:usersStats.losses + stats.incorrect,winningDays:stats.correct > stats.incorrect ? usersStats.winningDays + 1 : usersStats.winningDays,losingDays:stats.incorrect >= stats.correct ? usersStats.losingDays + 1 : usersStats.losingDays}
    const updateUsersStats = await DB.update(`predictions-${uid}`,'stats',newUsersStats);
    const updateUsersPredictions = await DB.update(`predictions-${uid}`,d,{predictions:calcedGames})
    if(!updateUsersStats || !updateUsersPredictions){throw new Error(`🚦Couldnt update users info🚦`)}
    
    // Now gameId is "2025020819"
    return c.json(calcedGames)
  } catch (error) {
    console.log(`Couldnt calc picks ${error}`)
    return c.text(`Error Calcing picks ${error}`)
  }
})
api.post('/submit-picks',authMiddleware,async(c)=>{
  const body = await c.req.parseBody();
  const email = c.get("email")
  const uid = await HELPERS.emailUID(email);
  const d = HELPERS.getPFDateFromDate(new Date);
  const savePicks = await DB.create(`predictions-${uid}`,d.apiString,body);

  // body will look like: { "game_123": "NYR", "game_456": "TBL" }
  console.log("User Picks:", body);
  

  return c.redirect('/ping')
})
api.get('/', (c) => c.text('API GET')) 

export default api;