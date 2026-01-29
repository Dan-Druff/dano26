import { Layout } from "../components/Layout.tsx"
import { DBUserData} from "../utils/consts.ts";


type NewCardProps = {
  email: string
  userData:DBUserData,
    cards:string[]
}

export function NewCardsPage({ userData, email,cards}: NewCardProps) {


  return (
    <Layout email={email}>
      <h2>New Cards</h2>
        <pre>{JSON.stringify(cards,null,2)}</pre>

    </Layout>
  )
}
