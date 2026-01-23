type NavProps = {
  email?:string,
  displayName?:string,
  userId?:string
}
export function Nav({ email, displayName, userId }: NavProps) {
  const isLoggedIn = Boolean(email)

  return (
    <nav class="nav">
      <a href="/" class="logo">DANO</a>

      {isLoggedIn ? (
        <div class="nav-right">
          <a href="/dashboard">Dashboard</a>
          <a href="/profile">Profile</a>

          <span class="user">
            {displayName ?? email}
          </span>

          <form method="get" action="/logout">
            <button type="submit">Log out</button>
          </form>
        </div>
      ) : (
        <div class="nav-right">
          <a href="/login">Log in</a>
          <a href="/signup" class="cta">Sign up</a>
        </div>
      )}
    </nav>
  )
}