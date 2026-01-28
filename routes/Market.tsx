import { Layout } from "../components/Layout.tsx"
import { DBUserData } from "../utils/consts.ts";

type MarketProps = {
  email: string
  userData:DBUserData
}

export function MarketPage({ userData, email }: MarketProps) {
  return (
    <Layout email={email}>
      <h2>MARKET</h2>
        <p>You have {userData.pucks} pucks.</p>
        <a href="/buyPucks" class="butt">BUY PUCKS</a>
        <a href="/buyCards" class="butt">BUY CARDS</a>
      <p>{JSON.stringify(userData,null,2)}</p>
      <script src="/static/js/market.js" defer></script>
    </Layout>
  )
}
