import { Layout } from "../components/Layout.tsx"
import { DBUserData } from "../utils/consts.ts";

type BuyPuckProps = {
  email: string
  userData:DBUserData
}

export function BuyPuckPage({ userData, email }: BuyPuckProps) {
  return (
    <Layout email={email}>
      <h2>Buy Pucks</h2>
    
      <p>{JSON.stringify(userData,null,2)}</p>
      <button type="button" id="buttonPress" class="butt">PRESS ME</button>
        <form id="buyPuckForm" class="buyPuckForm" action='/api/buyPucks' method="post">
          <h2>ADD PUCKS:</h2>
          <div class="formGroup">
            <label for="userNumber">Amount:</label>
           
            <input type="number" id="userNumber" name="userNumber" required />
            <span id="error-message" class="error-message"></span>
          </div>
          <button type="submit" class="butt">Submit</button>
        </form>
      <script src="/static/js/buyPucks.js" defer></script>
    </Layout>
  )
}
