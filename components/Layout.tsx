import { Nav } from "./Nav.tsx"

type LayoutProps = {
    title?: string,
    email?:string,
    userId?:string,
    displayName?:string,
    children?: unknown
}

export function Layout({ title = "DANO", email, userId, displayName, children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="/static/styles/globals.css" />
         <link rel="icon" href="/static/images/pffavicon.ico" />
      </head>
      <body>
        <Nav displayName={displayName} email={email} userId={userId}/>
        <h3>BODY</h3>
        <p>{title} {email} {displayName}</p>
        <main class="container">{children}</main>
      </body>
    </html>
  )
}
