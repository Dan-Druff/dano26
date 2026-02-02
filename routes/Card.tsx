import { Layout } from "../components/Layout.tsx"
import { DBUserData} from "../utils/consts.ts";
import { getCardsFromIds } from "../utils/puckface.ts";


type CardProps = {
    email: string
    userData:DBUserData,
    card:string
}

export async function CardPage({ userData, email, card}: CardProps) {
    const pfCard = await getCardsFromIds([card]);
  return (
    <Layout email={email}>
        <head>
            <link rel="stylesheet" href="/static/styles/card.css" />
        </head>
     
       <div class="main">

  
        <div class="appContainer">
            <div id="card-container" 
            data-userdata={JSON.stringify(userData)} 
            data-cards={JSON.stringify(pfCard[0])}>
                <h2>{JSON.stringify(pfCard[0],null,2)}</h2>
            </div>
           
        </div>
      
    </div>
          <script src="/static/js/card.js" defer></script>
    </Layout>
  )
}
