import { Layout } from "../components/Layout.tsx";
import { NHLGame } from "../components/NHLGame.tsx";
import { DBUserData } from "../utils/consts.ts";
import { HELPERS, NHL } from "../utils/puckface.ts";

type PredictorProps = {
    email:string,
    userData:DBUserData
}
const g = await NHL.getNhlGamesWithRecords(HELPERS.getPFDateFromDate(new Date).apiString)

export function PredictorPage({email,userData}:PredictorProps){
    return (
        <Layout email={email}>
            <h2>PREDICTOR PAGE</h2>
                  <form action="/api/submit-picks" method="post">
                  <div class="games">
                    {g.map(g => <NHLGame game={g} key={g.gameId}/>)}
                  </div>
                  
                  <button type="submit" class="butt">
                    Submit All Picks
                  </button>
                </form>
            <script src="/static/js/predictor.js" defer></script>
        </Layout>
    )
}