// @ts-check
/// <reference lib="dom" />  
console.log(`This thing ON??`)    
const cardContainer = document.getElementById('card-container');
const cards = JSON.parse(cardContainer.dataset.cards);
const userData = JSON.parse(cardContainer.dataset.userdata)
         

            cards.forEach((card) => {
                const cardElement = document.createElement("div");
                cardElement.classList.add("card");

                const cardInner = document.createElement("div");
                cardInner.classList.add("card-inner");

                const cardFront = document.createElement("div");
                cardFront.classList.add("card-front");
                let tgparts = card.cardId.split("-");
                const idToDisplay = tgparts.slice(0, 4).join("-");
                let rarityClass = "standard";
                if (card.rarity === "Rare") {
                    rarityClass = "rare";
                } else if (card.rarity === "Super Rare") {
                    rarityClass = "superrare";
                } else if (card.rarity === "Unique") {
                    rarityClass = "unique";
                }
                let inGameText = "NO GAME";
                let inGameClass = "redbadge";
                if (card.inGamePos !== "NONE") {
                    inGameClass = "greenbadge";
                    inGameText = "IN GAME";
                }
                let inTradeClass = "redbadge";
                let inTradeText = "NO TRADES";
                if (userData.tradingBlockIds.includes(card.cardId)) {
                    inTradeClass = "greenbadge";
                    inTradeText = "IN TRADE";
                }
                if(card.playerPos === 'G'){
                    cardFront.innerHTML = `
                            <h3>${card.firstName} ${card.lastName}</h3>
                            <img class="cardImg" src="${card.avatar}" alt="${card.firstName} ${card.lastName}">
                            <hr class="smallRedLine"/>                  
                            <div class="rarityDiv ${rarityClass}">
                            <h4> ${card.rarity}</h4>
                            </div>
                                <div class="row">
                            <p>${card.playingTonight ? "🟢" : "⭕"}${idToDisplay}<p>
                            <img class="teamImg" src="https://assets.nhle.com/logos/nhl/svg/${card.team}_dark.svg" alt="teamLogo"/>    
                            </div>
                        
                        
                            <div class="stats">
                            <div>
                                <h4>WINS</h4>
                                <p><span class="badge">${card.stats.wins}</span></p>
                            </div>
                                <div>
                                <h4>S/O</h4>
                                <p><span class="badge">${card.stats.shutouts}</span></p>
                            </div>
                                <div>
                                <h4>PTS</h4>
                                <p><span class="badge">${card.points}</span></p>
                            </div>
                            </div>
                    
                                                

                            <hr class="smallRedLine"/>
                            <button class="butt">DETAILS</button>
                        `;
                }else{
                    cardFront.innerHTML = `
                            <h3>${card.firstName} ${card.lastName}</h3>
                            <img class="cardImg" src="${card.avatar}" alt="${card.firstName} ${card.lastName}">
                            <hr class="smallRedLine"/>                  
                            <div class="rarityDiv ${rarityClass}">
                            <h4> ${card.rarity}</h4>
                            </div>
                            
                                <div class="row">
                            <p>${card.playingTonight ? "🟢" : "⭕"}${idToDisplay}<p>
                            <img class="teamImg" src="https://assets.nhle.com/logos/nhl/svg/${card.team}_dark.svg" alt="teamLogo"/>    
                            </div>
                            
                            <div class="stats">
                            <div>
                                <h4>G</h4>
                                <p><span class="badge">${card.stats.goals}</span></p>
                            </div>
                                <div>
                                <h4>A</h4>
                                <p><span class="badge">${card.stats.assists}</span></p>
                            </div>
                            <div>
                                <h4>+/-</h4>
                                <p><span class="badge">${card.stats.plusMinus}</span></p>
                            </div>
                                <div>
                                <h4>PTS</h4>
                                <p><span class="badge">${card.points}</span></p>
                            </div>
                            </div>
                
                                                

                            <hr class="smallRedLine"/>
                            <button class="butt">DETAILS</button>
                        `;
                }


                const cardBack = document.createElement("div");
                cardBack.classList.add("card-back");
                const parts = card.cardId.split('-');
                const posID = parseInt(parts[5], 10);
                let pos = 'c';
                switch (posID) {
                    case 1:
                    pos = 'C';
                        break;
                    case 2:
                    pos = 'LW';
                        break;
                    case 3:
                    pos = 'RW';
                        break;
                    case 4:
                    pos = 'D';
                        break;
                    case 5:
                    pos = 'G';
                        break;
                    default:
                        break;
                    }
                cardBack.innerHTML = `<br />
                            <p>${card.firstName} ${card.lastName}</p>
                            <hr class="smallRedLine"/>
                            <p class="${rarityClass}">${card.cardId}</p>
                            <hr class="blueLine"/>
                            <div class="stats">
                        
                            <div>
                                <h4>NUM.</h4>
                                <p><span class="badge">${card.sweaterNumber}</span></p>
                            </div>
                                <div>
                                <h4>POS.</h4>
                                <p><span class="badge">${pos}</span></p>
                            </div>
                            <div>
                                <h4>TEAM</h4>
                                <p><span class="badge">${card.team}</span></p>
                            </div>
                            
                            </div>
                            <hr class="smallRedLine"/>
                            <div class="row">
                            <p><span class="${inGameClass}">${inGameText}</span></p><p><span class="${inTradeClass}">${inTradeText}</span></p>
                            </div>
                            <hr class="blueLine"/>
                            <a href='/card/${card.cardId}'>GO TO CARD</a>
                            <hr class="smallRedLine"/>
                            <br />
                            <button class="butt">BACK</button>
                        `;
        
        

                cardInner.appendChild(cardFront);
                cardInner.appendChild(cardBack);
                cardElement.appendChild(cardInner);
                cardContainer.appendChild(cardElement);

                cardFront.querySelector("button").addEventListener("click", () => {
                    cardElement.classList.add("is-flipped");
                });

                cardBack.querySelector("button").addEventListener("click", () => {
                    cardElement.classList.remove("is-flipped");
                });
                });