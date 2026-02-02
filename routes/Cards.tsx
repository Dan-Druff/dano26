import { Layout } from "../components/Layout.tsx"
import { DBUserData} from "../utils/consts.ts";
import { getCardsFromIds } from "../utils/puckface.ts";


type CardsProps = {
    email: string
    userData:DBUserData
}

export async function CardsPage({ userData, email}: CardsProps) {
    const allPfCards = await getCardsFromIds(userData.cards);
  return (
    <Layout email={email}>
        <head>
            <link rel="stylesheet" href="/static/styles/cards.css" />
        </head>
     
       <div class="main">

  
        <div class="appContainer">
            <div id="card-container" 
            data-userdata={JSON.stringify(userData)} 
            data-cards={JSON.stringify(allPfCards)}></div>
           
        </div>
      
    </div>
          <script src="/static/js/cards.js" defer></script>
    </Layout>
  )
}
