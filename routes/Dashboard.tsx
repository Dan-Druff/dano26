import { Layout } from "../components/Layout.tsx"
import { DBUserData } from "../utils/consts.ts";

type DashboardProps = {
  email: string
  userData:DBUserData
}

export function DashboardPage({ userData, email }: DashboardProps) {
  return (
    <Layout email={email}>
      <h2>DASHBOARD</h2>
      <pre>{email}</pre>
      <p>{JSON.stringify(userData,null,2)}</p>
      <button type="button" id="buttonPress" class="butt">PRESS ME</button>
      <script src="/static/js/dashboard.js" defer></script>
    </Layout>
  )
}
