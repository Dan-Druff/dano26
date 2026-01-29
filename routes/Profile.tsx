import { Layout } from "../components/Layout.tsx"
import { DBUserData } from "../utils/consts.ts";

type ProfileProps = {
  email: string
  userData:DBUserData
}

export function ProfilePage({ userData, email }: ProfileProps) {
  return (
    <Layout email={email}>
      <h2>PROFILE</h2>
        <p>You have {userData.pucks} pucks.</p>
   
      <p>{JSON.stringify(userData,null,2)}</p>

    </Layout>
  )
}
