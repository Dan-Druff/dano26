import { Layout } from "../components/Layout.tsx"
import { DBUserData } from "../utils/consts.ts";

type BuyCardProps = {
  email: string
  userData:DBUserData
}

export function BuyCardPage({ userData, email }: BuyCardProps) {
  return (
    <Layout email={email}>
      <h2>Buy Cards</h2>
    
      <p>{JSON.stringify(userData,null,2)}</p>
   
        <form id="buyCardForm" class="buyCardForm" action='/api/buyCards' method="post">
          <h2>BUY CARDS:</h2>
          <div class="formGroup">
            <label for="cardNumber">Amount:</label>
           
            <input type="number" id="cardNumber" name="cardNumber" required />
            <span id="error-message" class="error-message"></span>
          </div>
          <button type="submit" class="butt">Submit</button>
        </form>
      <script src="/static/js/buyCards.js" defer></script>
    </Layout>
  )
}
