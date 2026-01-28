import { Layout } from "../components/Layout.tsx";
import { NHLGame } from "../components/NHLGame.tsx";
import { DBUserData } from "../utils/consts.ts";
import { DB } from "../utils/db.ts";
import { HELPERS, NHL } from "../utils/puckface.ts";

type PredictorProps = {
    email:string,
    userData:DBUserData
}

export async function PredictorPage({email,userData}:PredictorProps){
    const g = await NHL.getNhlGamesWithRecords(HELPERS.getPFDateFromDate(new Date).apiString)
    const usersStats = await DB.read(`predictions-${userData.id}`,'stats')
    return (
        <Layout email={email}>
            <h2>PREDICTOR PAGE</h2>
            <pre>Stats {JSON.stringify(usersStats,null,2)}</pre>
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