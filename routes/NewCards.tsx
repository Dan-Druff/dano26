import { Layout } from "../components/Layout.tsx"
import { DBUserData} from "../utils/consts.ts";
import { getCardsFromIds } from "../utils/puckface.ts";


type NewCardProps = {
  email: string
  userData:DBUserData,
    cards:string[]
}

export async function NewCardsPage({ userData, email,cards}: NewCardProps) {
    const allPfCards = await getCardsFromIds(cards);
  return (
    <Layout email={email}>
        <head>
            <link rel="stylesheet" href="/static/styles/newcards.css" />
        </head>
        {/* <h2>New Cards</h2>
        <pre>{JSON.stringify(cards,null,2)}</pre> */}
        <div class="main">
            {/* <div class="control">
                <button id="control1">DATA BUTTON</button>
            </div> */}
            <div class="appContainer">
                <div id="card-container" data-cards={JSON.stringify(allPfCards)} data-userdata={JSON.stringify(userData)}></div>
            </div>
        </div>
          <script src="/static/js/newcards.js" defer></script>
    </Layout>
  )
}
