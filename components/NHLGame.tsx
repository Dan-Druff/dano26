import { NHLGameWithRecord } from "../utils/consts.ts";

type NHLGameProps = {
  game: NHLGameWithRecord;
};
export function NHLGame({ game }: NHLGameProps) {
  return (
    <div class="gameCard">
     
      <div class="awayTeam">
      <label class="team-label">
        <input type="radio" name={`${game.gameId}`} value={game.awayTeamAbb} required />
        <div class="team-content">
          <img src={game.awayLogo} alt="" />
          <h3>{game.awayTeamAbb}</h3>
          <p>{game.awayRecord}</p>
        </div>
      </label>
        </div>
      <div class="vs">@</div>

      <div class="homeTeam">
      <label class="team-label">
        <input type="radio" name={`${game.gameId}`} value={game.homeTeamAbb} />
        <div class="team-content">
          <img src={game.homeLogo} alt="" />
          <h3>{game.homeTeamAbb}</h3>
              <p>{game.homeRecord}</p>
        </div>
      </label>
      </div>
    </div>
  );
}
// export function NHLGame({ game }: NHLGameProps) {
//   return (
//     <>
//       <div class="gameCard">
//         <div 
//           class="awayTeam team-box" 
//           onclick={`selectTeam(this, '${game.awayTeamAbb}')`}
//         >
//           <img src={game.awayLogo}/>
//           <h3>{game.awayTeamAbb}</h3>
//           <p>{game.awayRecord}</p>
//         </div>

//         <h3>@</h3>

//         <div 
//           class="homeTeam team-box" 
//           onclick={`selectTeam(this, '${game.homeTeamAbb}')`}
//         >
//           <img src={game.homeLogo}/>
//           <h3>{game.homeTeamAbb}</h3>
//           <p>{game.homeRecord}</p>
//         </div>
//       </div>

//       {/* This script is sent to the browser along with the HTML */}
//       <script dangerouslySetInnerHTML={{ __html: `
//         function selectTeam(element, team) {
//           // Remove selected class from siblings
//           const card = element.closest('.gameCard');
//           card.querySelectorAll('.team-box').forEach(el => el.classList.remove('selected'));
          
//           // Add to current
//           element.classList.add('selected');
//           console.log("Selected:", team);
          
//           // Here you could fetch('/api/pick', { method: 'POST', body: ... })
//         }
//       `}} />
      
//       <style>{`
//         .team-box { cursor: pointer; transition: 0.2s; padding: 10px; border: 2px solid transparent; }
//         .team-box:hover { background: #f4f4f4; border-radius: 8px; }
//         .selected { border-color: #007bff; background: #e7f3ff !important; border-radius: 8px; }
//       `}</style>
//     </>
//   );
// }
// export function NHLGame({ game }: NHLGameProps) {
//   return (
//     <div class="game-card">
//       {/* Away Team Button */}
//       <button 
//         class="team-selection" 
//         onclick={`handlePick('${game.id}', '${game.awayTeamAbb}')`}
//       >
//         <img src={game.awayLogo} alt={game.awayTeamAbb} />
//         <h3>{game.awayTeamAbb}</h3>
//         <p>{game.awayRecord}</p>
//       </button>

//       <div class="vs-separator">@</div>

//       {/* Home Team Button */}
//       <button 
//         class="team-selection" 
//         onclick={`handlePick('${game.id}', '${game.homeTeamAbb}')`}
//       >
//         <img src={game.homeLogo} alt={game.homeTeamAbb} />
//         <h3>{game.homeTeamAbb}</h3>
//         <p>{game.homeRecord}</p>
//       </button>

//     </div>
//   );
// }
// export function NHLGame({ game }: NHLGameProps) {
//   return (
//     <div class="gameCard">
//         <div class="awayTeam">
//             <img src={game.awayLogo}/>
//             <h3>{game.awayTeamAbb}</h3>
//             <p>{game.awayRecord}</p>
//         </div>
//         <h3>@</h3>
//         <div class="homeTeam">
//             <img src={game.homeLogo}/>
//             <h3>{game.homeTeamAbb}</h3>
//             <p>{game.homeRecord}</p>
//         </div>
        
  
//     </div>
//   );
// }