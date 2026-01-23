import { Hono } from "hono";
import { DB } from "./db.ts";
import argon2 from 'argon2'
import { LoginPage,SignupPage } from "../routes/Login.tsx";
import { DBUserData, User } from "./consts.ts";
import { HELPERS, USERS } from "./puckface.ts";
import { setCookie, getCookie, deleteCookie } from "hono/cookie"

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
api.get('/', (c) => c.text('API GET')) 

export default api;