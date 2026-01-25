import { Layout } from "../components/Layout.tsx";

type LoginPageProps = {
    error?:string,
    email?:string
}
export const LoginPage = ({error,email}:LoginPageProps)=>{
    return (
        <Layout email={email}>
               <section id="login">
                <h1>Login</h1>
                {error && (<p class="error">{error}</p>)}
                <p>Get started with your email</p>
                <form method="post" action="/api/login">
                    <div>
                        <label>Email</label>
                        <input value={email} name="email" type="email" placeholder="you@example.com" required />
                    </div>
                    <div>
                        <label>Password</label>
                        <input name="password" type="password" placeholder="At least 8 characters" minlength={8} required />
                    </div>
                  <button type="submit">Login</button>
                </form>
                <div class="switch">Dont have have an account?<a href="/signup">Sign Up</a></div>
            </section>
        </Layout>
    )
}
type SignupPageProps = {
    error?:string,
    email?:string
}

export const SignupPage = ({error,email}:SignupPageProps)=>{
    return (
        <Layout email={email}>
                    <section id="signup">
                <h1>SIGNUP</h1>
                {error && (<p class="error">{error}</p>)}
                
                <form method="post" action="/api/signup">
                    <div>
                        <label>Email</label>
                        <input value={email} name="email" type="email" placeholder={email ?? 'you@example.com'} required />
                    </div>
                    <div>
                        <label>Password</label>
                        <input name="password1" type="password" placeholder="At least 8 characters" minlength={8} required />
                    </div>
                    <div>
                        <label>Confirm password</label>
                        <input name="password2" type="password" required />
                    </div>
                    <button type="submit">Create Account</button>
                </form>
                <div class="switch">Already have an account?<a href="/login">Log in</a></div>
            </section>
        </Layout>
    )
}