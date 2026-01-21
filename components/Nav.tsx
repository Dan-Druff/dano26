type NavProps = {
  email?:string,
  displayName?:string,
  userId:string | null | undefined
}
export function Nav({email, displayName, userId}:NavProps){
    return (
        <div>
            {userId ? <p>{userId}</p> : <p>Not Signed In</p>}
            <h1>NAV</h1>
            <p>{email} {displayName} {userId}</p>
        </div>
    )
}