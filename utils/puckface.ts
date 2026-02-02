
import { DB } from "./db.ts";
import { RosterPlayer,PFTx, PFDate, DBUserData, PF_CONSTS, PFCard, DBGame, nobodyCard, CardDecon, PFRarityType, PFGamePosType, NHLGame, NHLGameData, PFTeamIds, PFNhlStatType, PFTeamCards, nobodyTeam, PFStats, PFGameState, ChirpType, DBChirp, NHLScoreboardResponse, PFPrediction, PFLeague, PFLeagueMembers, NHLGameWithRecord } from "./consts.ts";
import MasterRoster from "../localDB/nhl/master_roster.json" with { type:"json"};
const PLAYER_REGISTRY = new Map<number, RosterPlayer>(
  MasterRoster.map(p => [p.id, p])
);
// TO DO...
export const getNHLScoreboard = async (): Promise<NHLScoreboardResponse | null> => {
    try {
      const response = await fetch(
        "https://api-web.nhle.com/v1/scoreboard/now"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch NHL scoreboard data");
      }
      return await response.json();
    } catch (error) {
      console.log(`Error gettign scoreboard ${error}`);
      return null;
    }
}
export const showNHLGames = async (day: string) => {

  const games = await getNHLScoreboard();
  if (!games) {
    throw new Error(`Error getting games`);
  }
  HELPERS.displayGames(day, games);
};
export const updateDataAfterGameCalc = async(cg:DBGame):Promise<boolean>=>{
  try {
    const homeUser = await DB.read("users",cg.homeId) as DBUserData | null;
    const awayUser = await DB.read("users",cg.awayId) as DBUserData | null;
    if(!homeUser || !awayUser){throw new Error(`🚦Couldnt get users🚦`)}
    let awayPucks = awayUser.pucks;
    let homePucks = homeUser.pucks;
        const homeTx: PFTx = {
      by: PF_CONSTS.APP_NAME,
      cards: [],
      from: PF_CONSTS.APP_NAME,
      id: HELPERS.createRandomID(8),
      regarding: cg.id,
      state: "complete",
      to: cg.homeId,
      tx: true,
      type: "gameOver",
      value: cg.value,
      whatHappened: "",
      when: cg.date,
    };
    const awayTx: PFTx = {
      by: PF_CONSTS.APP_NAME,
      cards: [],
      from: PF_CONSTS.APP_NAME,
      id: HELPERS.createRandomID(8),
      regarding: cg.id,
      state: "complete",
      to: cg.awayId,
      tx: true,
      type: "gameOver",
      value: cg.value,
      whatHappened: "",
      when: cg.date,
    };
    let homeChirpType :ChirpType = "message";
    let awayChirpType :ChirpType = "message";
    let wh = '';
    if(cg.gameState === "Away Team Wins"){
      awayPucks = awayPucks + cg.value + cg.value;
      awayTx.whatHappened = `${cg.awayName} wins ${cg.awayScore}-${cg.homeScore} over ${cg.homeName}`;
      homeTx.whatHappened = `${cg.homeName} loses ${cg.homeScore}-${cg.awayScore} to ${cg.awayName}`;
      awayTx.type = "winGame";
      homeTx.type = "loseGame";
      homeChirpType = 'loseGame';
      awayChirpType = 'winGame';
      wh = `${cg.awayName} wins over ${cg.homeName} in game ${cg.id}.`
    }else if(cg.gameState === "Home Team Wins"){
      homePucks = homePucks + cg.value + cg.value;
      awayTx.whatHappened = `${cg.awayName} loses ${cg.awayScore}-${cg.homeScore} to ${cg.homeName}`;
      homeTx.whatHappened = `${cg.homeName} wins ${cg.homeScore}-${cg.awayScore} over ${cg.awayName}`;
      awayTx.type = "loseGame";
      homeTx.type = "winGame";
      homeChirpType = 'winGame';
      awayChirpType = 'loseGame';
      wh = `${cg.homeName} wins over ${cg.awayName} in game ${cg.id}.`
    }else if(cg.gameState === "Tied"){
      homePucks = homePucks + cg.value;
      awayPucks = awayPucks + cg.value;
      awayTx.whatHappened = `${cg.awayName} tied ${cg.awayScore}-${cg.homeScore} with ${cg.homeName}`;
      homeTx.whatHappened = `${cg.homeName} tied ${cg.homeScore}-${cg.awayScore} with ${cg.awayName}`;
      awayTx.type = "tieGame";
      homeTx.type = "tieGame";
      homeChirpType = 'tiedGame';
      awayChirpType = 'tiedGame';
      wh = `${cg.awayName} ties ${cg.homeName} in game ${cg.id}.`
    }
        const homeChirp :DBChirp = {
        content:homeTx.whatHappened,
        date:new Date,
        from:cg.awayId,
        id:HELPERS.createRandomID(8),
        isChirp:true,
        regarding:'game',
        regardingId:cg.id,
        seen:false,
        state:'complete',
        to:cg.homeId,
        type:homeChirpType,
        regardingId2:''
    }
    const awayChirp :DBChirp = {
        content:awayTx.whatHappened,
        date:new Date,
        from:cg.homeId,
        id:HELPERS.createRandomID(8),
        isChirp:true,
        regarding:'game',
        regardingId:cg.id,
        seen:false,
        state:'complete',
        to:cg.awayId,
        type:awayChirpType,
        regardingId2:''
    }
        const newAwayPast = [...awayUser.pastGameIds, cg.id];
    const newAwayActive = awayUser.activeGameIds.filter((g) => g !== cg.id);
    const newHomePast = [...homeUser.pastGameIds, cg.id];
    const newHomeActive = homeUser.activeGameIds.filter((g) => g !== cg.id);
    const awayUpd = await DB.update("users",cg.awayId,{pucks:awayPucks,activeGameIds:newAwayActive,pastGameIds:newAwayPast});
    const homeUpd = await DB.update("users",cg.homeId,{pucks:homePucks,activeGameIds:newHomeActive,pastGameIds:newHomePast});
    const gameUpdate = await DB.update("games",cg.id,{awayScore:cg.awayScore,homeScore:cg.homeScore,gameState:cg.gameState});
    
    await CHIRPS.send(homeChirp);
    await CHIRPS.send(awayChirp);
    await LOG.add(cg.awayId,awayTx);
    await LOG.add(cg.homeId,homeTx);
    if(!awayUpd || !homeUpd || !gameUpdate){throw new Error(`🚦Couldnt update info🚦`)}
    return true;
  } catch (error) {
    console.log(`Error Updating game after calc ${error}`);
    return false;
  }
}
export const getAllDBGames = async():Promise<DBGame[] | null> => {
  // TODO
  try {
    const games = await DB.getAllFromCollection("games") as DBGame[] | null;
    if(!games){throw new Error(`🚦Could not get games🚦`)}
    return games;
  } catch (error) {
    console.log(`Something went wrong getting DB GAMES ${error}`)
    return null;
  }
}
export const getGameByID = async (
  gameID: string | number
): Promise<{
  homeScore: number;
  awayScore: number;
  ot: number;
  allPlayerStats: any;
} | null> => {
  try {
    const boxRes = await fetch(
      `https://api-web.nhle.com/v1/gamecenter/${gameID}/boxscore`
    );
    const boxscore = (await boxRes.json()) as any;
    const ot =
      boxscore.gameOutcome.lastPeriodType === "OT"
        ? boxscore.gameOutcome.otPeriods
        : 0;
    const allPlayersStats = boxscore.playerByGameStats;
    return {
      homeScore: boxscore.homeTeam.score | 0,
      awayScore: boxscore.awayTeam.score | 0,
      ot: ot,
      allPlayerStats: allPlayersStats,
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};
export const calculateGame = async(dbgame:DBGame):Promise<DBGame | null>=>{
  try {
      console.log(`Starting Calc Game`);
      let arrayOfIds: string[] = [
      dbgame.awayTeam.lw,
      dbgame.awayTeam.c,
      dbgame.awayTeam.rw,
      dbgame.awayTeam.d1,
      dbgame.awayTeam.d2,
      dbgame.awayTeam.g,
      dbgame.homeTeam.lw,
      dbgame.homeTeam.c,
      dbgame.homeTeam.rw,
      dbgame.homeTeam.d1,
      dbgame.homeTeam.d2,
      dbgame.homeTeam.g,
    ];
    arrayOfIds = [...new Set(arrayOfIds)];
    arrayOfIds = arrayOfIds.filter((id) => id !== "defID");
    arrayOfIds = arrayOfIds.filter((id)=> id !== "defId");
    const myGames = await getGamesByDayScore(dbgame.date)
    if (!myGames) {throw new Error(`Error gettiung games`)}
    const tonightsTeams = myGames.tonightsTeams;
    let teamsOfCardsIHave = arrayOfIds.map((cid) => {
      const card = HELPERS.deconstructCardID(cid);
      return card.team;
    });
    const oldgamesICareAbout = myGames.games.filter(
      (gm) =>
        teamsOfCardsIHave.indexOf(gm.awayTeamAbb) > -1 ||
        teamsOfCardsIHave.indexOf(gm.homeTeamAbb) > -1
    );
     const gamesICareAbout = oldgamesICareAbout.filter(
      (obj, index, self) => index === self.findIndex((o) => o.id === obj.id)
    );
    const allCards = await Promise.all(arrayOfIds.map(async(id)=>{
      const nc = await getCardFromId(id,[dbgame],tonightsTeams);
      if(!nc){throw new Error(`🚦Error getting card🚦`)}
      nc.stats.assists = 0;
      nc.stats.goals = 0;
      nc.stats.plusMinus = 0;
      nc.stats.shutouts = 0;
      nc.stats.wins = 0;
      nc.points = 0;
      return nc;
    }))
    let allAwayForwardsWithPoints: PFNhlStatType[] = [];
    let allAwayDefenseWithPoints: PFNhlStatType[] = [];
    let allAwayGoaliesWithPoints: PFNhlStatType[] = [];
    let allHomeForwardsWithPoints: PFNhlStatType[] = [];
    let allHomeDefenseWithPoints: PFNhlStatType[] = [];
    let allHomeGoaliesWithPoints: PFNhlStatType[] = [];
    const ng = await Promise.all(gamesICareAbout.map(async(game)=>{
       const boxscore = await getGameByID(game.id);
        if (!boxscore) {throw new Error(`🚦Error getting boxscore🚦`)}
        const homeScore = boxscore.homeScore;
        const awayScore = boxscore.awayScore;
        const winnerIs = homeScore > awayScore ? "home" : "away";
        const allPlayersStats = boxscore.allPlayerStats;

        const awayForwardsWithPoints: PFNhlStatType[] =
          allPlayersStats.awayTeam.forwards.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "F",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });

        const awayDefenseWithPoints: PFNhlStatType[] =
          allPlayersStats.awayTeam.defense.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "D",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });
        const awayGoaliesWithPoints: PFNhlStatType[] =
          allPlayersStats.awayTeam.goalies.map((f: any) => {
            const timeOnIce = HELPERS.convertTimeToMinutes(f.toi);
            const pnst: PFNhlStatType = {
              assists: 0,
              goals: 0,
              id: f.playerId,
              plusMinus: 0,
              points: 0,
              pos: "G",
              shutout: f.goalsAgainst === 0 && timeOnIce > 9 ? 1 : 0,
              toi: f.toi,
              win: winnerIs === "away" && timeOnIce > 9 ? 1 : 0,
            };
            return pnst;
          });
        const homeForwardsWithPoints: PFNhlStatType[] =
          allPlayersStats.homeTeam.forwards.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "F",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });
        const homeDefenseWithPoints: PFNhlStatType[] =
          allPlayersStats.homeTeam.defense.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "D",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });
        const homeGoaliesWithPoints: PFNhlStatType[] =
          allPlayersStats.homeTeam.goalies.map((f: any) => {
            const timeOnIce = HELPERS.convertTimeToMinutes(f.toi);
            const pnst: PFNhlStatType = {
              assists: 0,
              goals: 0,
              id: f.playerId,
              plusMinus: 0,
              points: 0,
              pos: "G",
              shutout: f.goalsAgainst === 0 && timeOnIce > 9 ? 1 : 0,
              toi: f.toi,
              win: winnerIs === "home" && timeOnIce > 9 ? 1 : 0,
            };
            return pnst;
          });
        allAwayForwardsWithPoints = [
          ...allAwayForwardsWithPoints,
          ...awayForwardsWithPoints,
        ];
        allAwayDefenseWithPoints = [
          ...allAwayDefenseWithPoints,
          ...awayDefenseWithPoints,
        ];
        allAwayGoaliesWithPoints = [
          ...allAwayGoaliesWithPoints,
          ...awayGoaliesWithPoints,
        ];
        allHomeForwardsWithPoints = [
          ...allHomeForwardsWithPoints,
          ...homeForwardsWithPoints,
        ];
        allHomeDefenseWithPoints = [
          ...allHomeDefenseWithPoints,
          ...homeDefenseWithPoints,
        ];
        allHomeGoaliesWithPoints = [
          ...allHomeGoaliesWithPoints,
          ...homeGoaliesWithPoints,
        ];
        return game;
    }))
    const allForwards = [
      ...allAwayForwardsWithPoints,
      ...allHomeForwardsWithPoints,
    ];
    const allDefense = [
      ...allAwayDefenseWithPoints,
      ...allHomeDefenseWithPoints,
    ];

    const allGoalies = [
      ...allAwayGoaliesWithPoints,
      ...allHomeGoaliesWithPoints,
    ];
    const aTeam: PFTeamCards = { ...nobodyTeam };
    const hTeam: PFTeamCards = { ...nobodyTeam };
    const updatedCards = allCards.map((crd) => {
      if (crd.cardId === dbgame.awayTeam.lw) {
        const relevant = allForwards.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        aTeam.lw = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.awayTeam.rw) {
        const relevant = allForwards.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        console.log(`${crd.lastName} got ${crd.points} points.`)
        aTeam.rw = crd;
        return crd;
      } else if (crd.cardId === dbgame.awayTeam.c) {
        const relevant = allForwards.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        aTeam.c = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.awayTeam.d1) {
        const relevant = allDefense.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        aTeam.d1 = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.awayTeam.d2) {
        const relevant = allDefense.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        aTeam.d2 = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.awayTeam.g) {
        const relevant = allGoalies.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: 0,
            goals: 0,
            plusMinus: 0,
            shutouts: relevant.shutout,
            wins: relevant.win,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: 0,
              goals: 0,
              plusMinus: 0,
              shutouts: relevant.shutout,
              wins: relevant.win,
            },
            true
          );
        }
        aTeam.g = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.homeTeam.lw) {
        const relevant = allForwards.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        hTeam.lw = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.homeTeam.rw) {
        const relevant = allForwards.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        hTeam.rw = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.homeTeam.c) {
        const relevant = allForwards.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        hTeam.c = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.homeTeam.d1) {
        const relevant = allDefense.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        hTeam.d1 = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.homeTeam.d2) {
        const relevant = allDefense.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: relevant.assists,
            goals: relevant.goals,
            plusMinus: relevant.plusMinus,
            shutouts: 0,
            wins: 0,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: relevant.assists,
              goals: relevant.goals,
              plusMinus: relevant.plusMinus,
              shutouts: 0,
              wins: 0,
            },
            false
          );
        }
        hTeam.d2 = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else if (crd.cardId === dbgame.homeTeam.g) {
        const relevant = allGoalies.find(
          (obj) => obj.id.toString() === crd.playerId
        );
        if (relevant) {
          crd.stats = {
            assists: 0,
            goals: 0,
            plusMinus: 0,
            shutouts: relevant.shutout,
            wins: relevant.win,
          };
          crd.points = HELPERS.getPlayersTotalsWithRarity(
            crd.rarity,
            {
              assists: 0,
              goals: 0,
              plusMinus: 0,
              shutouts: relevant.shutout,
              wins: relevant.win,
            },
            true
          );
        }
        hTeam.g = crd;
        console.log(`${crd.lastName} got ${crd.points} points.`)

        return crd;
      } else {
        return crd;
      }
    });
    const hScore =
      hTeam.lw.points +
      hTeam.c.points +
      hTeam.rw.points +
      hTeam.d1.points +
      hTeam.d2.points +
      hTeam.g.points;
    const aScore =
      aTeam.lw.points +
      aTeam.c.points +
      aTeam.rw.points +
      aTeam.d1.points +
      aTeam.d2.points +
      aTeam.g.points;
    const calcedGameState: PFGameState =
      hScore === aScore
        ? "Tied"
        : hScore > aScore
        ? "Home Team Wins"
        : "Away Team Wins";

    const newDbGame: DBGame = {
      awayScore: aScore,
      homeScore: hScore,
      awayId: dbgame.awayId,
      awayName: dbgame.awayName,
      awayTeam: {
        lw: aTeam.lw.cardId,
        c: aTeam.c.cardId,
        rw: aTeam.rw.cardId,
        d1: aTeam.d1.cardId,
        d2: aTeam.d2.cardId,
        g: aTeam.g.cardId,
        m: "defId",
      },
      date: dbgame.date,
      gameState: calcedGameState,
      homeId: dbgame.homeId,
      homeName: dbgame.homeName,
      homeTeam: {
        lw: hTeam.lw.cardId,
        c: hTeam.c.cardId,
        rw: hTeam.rw.cardId,
        d1: hTeam.d1.cardId,
        d2: hTeam.d2.cardId,
        g: hTeam.g.cardId,
        m: "defId",
      },
      id: dbgame.id,
      open: dbgame.open,
      private: dbgame.private,
      value: dbgame.value,
    };

  

    console.log(`Finished calc game:`);
    return newDbGame;
  } catch (error) {
    console.log(`🚦Couldnt calc game: ${error}🚦`)
    return null;
  }
}
export const getNHLGameBoxscoreById = async (
  gameID: string
): Promise<NHLGameData | null> => {
  try {
    const response = await fetch(
      `https://api-web.nhle.com/v1/gamecenter/${gameID}/boxscore`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch game data");
    }
    const data: NHLGameData = await response.json();
    return data;
  } catch (error) {
    console.log(`Error getting boxscore ${error}`);
    return null;
  }
};
export const getPlayerByID = async (
  playerID: string | number
): Promise<{
  firstName: string;
  lastName: string;
  avatar: string;
  sweaterNumber: number;
  points: number;
  assists: number;
  plusMinus: number;
  goals: number;
  wins: number;
  shutouts: number;
  regSeasonPoints: number;
  playoffPoints: number;
  regSeasonAssists: number;
  playoffAssists: number;
  regSeasonPlusMinus: number;
  playoffsPlusMinus: number;
  regSeasonGoals: number;
  playoffGoals: number;
  regSeasonWins: number;
  playoffWins: number;
  regSeasonShutouts: number;
  playoffShutouts: number;
  teamAbbrev: string;
  heroImage: string;
  country: string;
} | null> => {
  const aid = typeof playerID === "number" ? playerID.toString() : playerID;
  try {
    const pData = await fetch(
      `https://api-web.nhle.com/v1/player/${aid}/landing`
    );
    const pInfo = await pData.json();
    let regSeasonPoints = 0;
    let playoffPoints = 0;
    let regSeasonAssists = 0;
    let playoffAssists = 0;
    let regSeasonPlusMinus = 0;
    let playoffsPlusMinus = 0;
    let regSeasonGoals = 0;
    let playoffGoals = 0;
    let regSeasonWins = 0;
    let playoffWins = 0;
    let regSeasonShutouts = 0;
    let playoffShutouts = 0;

    if (
      pInfo.featuredStats &&
      pInfo.featuredStats.regularSeason &&
      pInfo.featuredStats.regularSeason.subSeason
    ) {
      regSeasonPoints = pInfo.featuredStats.regularSeason.subSeason.points ?? 0;
      regSeasonAssists = pInfo.featuredStats.regularSeason.subSeason.assists ?? 0;
      regSeasonPlusMinus =
        pInfo.featuredStats.regularSeason.subSeason.plusMinus ?? 0;
      regSeasonGoals = pInfo.featuredStats.regularSeason.subSeason.goals ?? 0;
      regSeasonWins = pInfo.featuredStats.regularSeason.subSeason.wins ?? 0;
      regSeasonShutouts = pInfo.featuredStats.regularSeason.subSeason.shutouts ?? 0;
    }
    if (
      pInfo.featuredStats &&
      pInfo.featuredStats.playoffs &&
      pInfo.featuredStats.playoffs.subSeason
    ) {
      playoffPoints = pInfo.featuredStats.playoffs.subSeason.points ?? 0;
      playoffAssists = pInfo.featuredStats.playoffs.subSeason.assists ?? 0;
      playoffsPlusMinus = pInfo.featuredStats.playoffs.subSeason.plusMinus ?? 0;
      playoffGoals = pInfo.featuredStats.playoffs.subSeason.goals ?? 0;
      playoffWins = pInfo.featuredStats.playoffs.subSeason.wins ?? 0;
      playoffShutouts = pInfo.featuredStats.playoffs.subSeason.shutouts ?? 0;
    }

    return {
      firstName: pInfo.firstName.default,
      lastName: pInfo.lastName.default,
      avatar: pInfo.headshot,
      sweaterNumber: pInfo.sweaterNumber,
      points: regSeasonPoints + playoffPoints,
      assists: regSeasonAssists + playoffAssists,
      plusMinus: regSeasonPlusMinus + playoffsPlusMinus,
      goals: regSeasonGoals + playoffGoals,
      wins: regSeasonWins + playoffWins,
      shutouts: regSeasonShutouts + playoffShutouts,
      regSeasonPoints: regSeasonPoints,
      playoffPoints: playoffPoints,
      regSeasonAssists: regSeasonAssists,
      playoffAssists: playoffAssists,
      regSeasonPlusMinus: regSeasonPlusMinus,
      playoffsPlusMinus: playoffsPlusMinus,
      regSeasonGoals: regSeasonGoals,
      playoffGoals: playoffGoals,
      regSeasonWins: regSeasonWins,
      playoffWins: playoffWins,
      regSeasonShutouts: regSeasonShutouts,
      playoffShutouts: playoffShutouts,
      teamAbbrev: pInfo.currentTeamAbbrev,
      heroImage: pInfo.heroImage,
      country: pInfo.birthCountry,
    };
  } catch (error) {
    console.log(`Could not get playerByID ${error}`);
    return null;
  }
};
export const getTeamInfoByID = (
  teamID: number
): {
  fullName: string;
  logo: string;
  abbrev: string;
  id: number;
  commonName: string;
  city: string;
} => {
    const teamObject = {
    fullName: "",
    logo: "https://assets.nhle.com/logos/nhl/svg/UTA_dark.svg",
    abbrev: "",
    id: teamID,
    city: "",
    commonName: "",
  };
  switch (teamID) {
    case 1:
      teamObject.abbrev = "NJD";
      teamObject.fullName = "New Jersey Devils";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/NJD_dark.svg";
      break;
    case 2:
      teamObject.abbrev = "NYI";
      teamObject.fullName = "New York Islanders";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/NYI_dark.svg";

      break;
    case 3:
      teamObject.abbrev = "NYR";
      teamObject.fullName = "New York Rangers";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/NYR_dark.svg";

      break;
    case 4:
      teamObject.abbrev = "PHI";
      teamObject.fullName = "Philadelphia Flyers";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/PHI_dark.svg";

      break;
    case 5:
      teamObject.abbrev = "PIT";
      teamObject.fullName = "Pittsburgh Penguins";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/PIT_dark.svg";

      break;
    case 6:
      teamObject.abbrev = "BOS";
      teamObject.fullName = "Boston Bruins";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/BOS_dark.svg";

      break;
    case 7:
      teamObject.abbrev = "BUF";
      teamObject.fullName = "Buffalo Sabres";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/BUF_dark.svg";

      break;
    case 8:
      teamObject.abbrev = "MTL";
      teamObject.fullName = "Montréal Canadiens";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/MTL_dark.svg";

      break;
    case 9:
      teamObject.abbrev = "OTT";
      teamObject.fullName = "Ottawa Senators";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/OTT_dark.svg";

      break;
    case 10:
      teamObject.abbrev = "TOR";
      teamObject.fullName = "Toronto Maple Leafs";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/TOR_dark.svg";

      break;
    case 11:
      teamObject.abbrev = "ATL";
      teamObject.fullName = "Atlanta Thrashers";
      break;
    case 12:
      teamObject.abbrev = "CAR";
      teamObject.fullName = "Carolina Hurricanes";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/CAR_dark.svg";

      break;
    case 13:
      teamObject.abbrev = "FLA";
      teamObject.fullName = "Florida Panthers";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/FLA_dark.svg";

      break;
    case 14:
      teamObject.abbrev = "TBL";
      teamObject.fullName = "Tampa Bay Lightning";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/TBL_dark.svg";

      break;
    case 15:
      teamObject.abbrev = "WSH";
      teamObject.fullName = "Washington Capitals";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/WSH_dark.svg";

      break;
    case 16:
      teamObject.abbrev = "CHI";
      teamObject.fullName = "Chicago Blackhawks";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/CHI_dark.svg";

      break;
    case 17:
      teamObject.abbrev = "DET";
      teamObject.fullName = "Detroit Red Wings";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/DET_dark.svg";

      break;
    case 18:
      teamObject.abbrev = "NSH";
      teamObject.fullName = "Nashville Predators";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/NSH_dark.svg";

      break;
    case 19:
      teamObject.abbrev = "STL";
      teamObject.fullName = "St. Louis Blues";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/STL_dark.svg";

      break;
    case 20:
      teamObject.abbrev = "CGY";
      teamObject.fullName = "Calgary Flames";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/CGY_dark.svg";

      break;
    case 21:
      teamObject.abbrev = "COL";
      teamObject.fullName = "Colorado Avalanche";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/COL_dark.svg";

      break;
    case 22:
      teamObject.abbrev = "EDM";
      teamObject.fullName = "Edmonton Oilers";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/EDM_dark.svg";

      break;
    case 23:
      teamObject.abbrev = "VAN";
      teamObject.fullName = "Vancouver Canucks";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/VAN_dark.svg";

      break;
    case 24:
      teamObject.abbrev = "ANA";
      teamObject.fullName = "Anaheim Ducks";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/ANA_dark.svg";

      break;
    case 25:
      teamObject.abbrev = "DAL";
      teamObject.fullName = "Dallas Stars";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/DAL_dark.svg";

      break;
    case 26:
      teamObject.abbrev = "LAK";
      teamObject.fullName = "Los Angeles Kings";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/LAK_dark.svg";

      break;
    case 27:
      teamObject.abbrev = "PHX";
      teamObject.fullName = "Phoenix Coyotes";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/PHX_dark.svg";

      break;
    case 28:
      teamObject.abbrev = "SJS";
      teamObject.fullName = "San Jose Sharks";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/SJS_dark.svg";

      break;
    case 29:
      teamObject.abbrev = "CBJ";
      teamObject.fullName = "Columbus Blue Jackets";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/CBJ_dark.svg";

      break;
    case 30:
      teamObject.abbrev = "MIN";
      teamObject.fullName = "Minnesota Wild";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/MIN_dark.svg";
      break;
    case 31:
      teamObject.abbrev = "MNS";
      teamObject.fullName = "Minnesota North Stars";
      break;
    case 32:
      teamObject.abbrev = "QUE";
      teamObject.fullName = "Quebec Nordiques";
      break;
    case 33:
      teamObject.abbrev = "WIN";
      teamObject.fullName = "Winnipeg Jets (1979)";
      break;
    case 34:
      teamObject.abbrev = "HFD";
      teamObject.fullName = "Hartford Whalers";
      break;
    case 35:
      teamObject.abbrev = "CLR";
      teamObject.fullName = "Colorado Rockies";
      break;
    case 36:
      teamObject.abbrev = "SEN";
      teamObject.fullName = "Ottawa Senators (1917)";
      break;
    case 37:
      teamObject.abbrev = "HAM";
      teamObject.fullName = "Hamilton Tigers";
      break;
    case 38:
      teamObject.abbrev = "PIR";
      teamObject.fullName = "Pittsburgh Pirates";
      break;
    case 39:
      teamObject.abbrev = "QUA";
      teamObject.fullName = "Philadelphia Quakers";
      break;
    case 40:
      teamObject.abbrev = "DCG";
      teamObject.fullName = "Detroit Cougars";
      break;
    case 41:
      teamObject.abbrev = "MWN";
      teamObject.fullName = "Montreal Wanderers";
      break;
    case 42:
      teamObject.abbrev = "QBD";
      teamObject.fullName = "Quebec Bulldogs";
      break;
    case 43:
      teamObject.abbrev = "MMR";
      teamObject.fullName = "Montreal Maroons";
      break;
    case 44:
      teamObject.abbrev = "NYA";
      teamObject.fullName = "New York Americans";
      break;
    case 45:
      teamObject.abbrev = "SLE";
      teamObject.fullName = "St. Louis Eagles";
      break;
    case 46:
      teamObject.abbrev = "OAK";
      teamObject.fullName = "Oakland Seals";
      break;
    case 47:
      teamObject.abbrev = "AFM";
      teamObject.fullName = "Atlanta Flames";
      break;
    case 48:
      teamObject.abbrev = "KCS";
      teamObject.fullName = "Kansas City Scouts";
      break;
    case 49:
      teamObject.abbrev = "CLE";
      teamObject.fullName = "Cleveland Barons";
      break;
    case 50:
      teamObject.abbrev = "DFL";
      teamObject.fullName = "Detroit Falcons";
      break;
    case 51:
      teamObject.abbrev = "BRK";
      teamObject.fullName = "Brooklyn Americans";
      break;
    case 52:
      teamObject.abbrev = "WPG";
      teamObject.fullName = "Winnipeg Jets";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/WPG_dark.svg";

      break;
    case 53:
      teamObject.abbrev = "ARI";
      teamObject.fullName = "Arizona Coyotes";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/ARI_dark.svg";

      break;
    case 54:
      teamObject.abbrev = "VGK";
      teamObject.fullName = "Vegas Golden Knights";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/VGK_dark.svg";

      break;
    case 55:
      teamObject.abbrev = "SEA";
      teamObject.fullName = "Seattle Kraken";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/SEA_dark.svg";

      break;
    case 56:
      teamObject.abbrev = "CGS";
      teamObject.fullName = "California Golden Seals";
      break;
    case 57:
      teamObject.abbrev = "TAN";
      teamObject.fullName = "Toronto Arenas";
      break;
    case 58:
      teamObject.abbrev = "TSP";
      teamObject.fullName = "Toronto St. Patricks";
      break;
    case 59:
      teamObject.abbrev = "UTA";
      teamObject.fullName = "Utah Hockey Club";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/UTA_dark.svg";

      break;
    case 68:
      teamObject.abbrev = "UTA";
      teamObject.fullName = "Utah Mammoth";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/UTA_dark.svg";
      break;
      case 70:
      teamObject.abbrev = "TBD";
      teamObject.fullName = "To be determined";
      break;
    case 99:
      teamObject.abbrev = "NHL";
      teamObject.fullName = "NHL";
      teamObject.logo = "https://assets.nhle.com/logos/nhl/svg/NHL_dark.svg";

      break;
    default:
      break;
  }
  return teamObject;
};
export const getCardFromId = async (
  cardId: string,
  activeGameList: DBGame[],
  teamsPlayingTonight: string[]
) => {
  try {
    
    const decon = HELPERS.deconstructCardID(cardId);
    const pInfo = await getPlayerByID(decon.playerID);

    if (!pInfo) {
      throw new Error(`Error getting p[iNfo]`);
    }
    let wins = 0;
    let shutouts = 0;
    let goals = 0;
    let assists = 0;
    let plusMinus = 0;
    let points = 0;
    const playingTonight = teamsPlayingTonight.indexOf(decon.team) > -1;
    let inGame = "none";
    let inUse: PFGamePosType = "NONE";
    activeGameList.forEach((g) => {
      if (g.homeTeam.c === cardId) {
        inUse = "C";
        inGame = g.id;
      }
      if (g.homeTeam.lw === cardId) {
        inGame = g.id;
        inUse = "LW";
      }
      if (g.homeTeam.rw === cardId) {
        inGame = g.id;
        inUse = "RW";
      }
      if (g.homeTeam.d1 === cardId) {
        inGame = g.id;
        inUse = "D1";
      }
      if (g.homeTeam.d2 === cardId) {
        inGame = g.id;
        inUse = "D2";
      }
      if (g.homeTeam.g === cardId) {
        inGame = g.id;
        inUse = "G";
      }
      if (g.awayTeam.c === cardId) {
        inUse = "C";
        inGame = g.id;
      }
      if (g.awayTeam.lw === cardId) {
        inGame = g.id;
        inUse = "LW";
      }
      if (g.awayTeam.rw === cardId) {
        inGame = g.id;
        inUse = "RW";
      }
      if (g.awayTeam.d1 === cardId) {
        inGame = g.id;
        inUse = "D1";
      }
      if (g.awayTeam.d2 === cardId) {
        inGame = g.id;
        inUse = "D2";
      }
      if (g.awayTeam.g === cardId) {
        inGame = g.id;
        inUse = "G";
      }
    });
    if (decon.posID === "G") {
      wins = pInfo.wins;
      shutouts = pInfo.shutouts;
      // determine points by wins and shutouts
      const s = shutouts * 5;
      const w = wins * 2;
      points = s + w;
    } else {
      points = pInfo.points;
      assists = pInfo.assists;
      plusMinus = pInfo.plusMinus;
      goals = pInfo.goals;
    }
    let cardPOS: "F" | "D" | "G" = "F";
    if (decon.posID === "G") {
      cardPOS = "G";
    }
    if (decon.posID === "D") {
      cardPOS = "D";
    }
    const salaryInfo = MASTER_ROSTER.findSalaryById(decon.playerID);
    if(!salaryInfo){throw new Error(`🚦Could not get salary🚦`)}
    const card: PFCard = {
      cardId: cardId,
      sweaterNumber: pInfo.sweaterNumber,
      firstName: pInfo.firstName,
      lastName: pInfo.lastName,
      avatar: pInfo.avatar,
      inGameId: inGame,
      inGamePos: inUse,
      playerId: decon.playerID,
      playingTonight: playingTonight,
      points: points,
      rarity: decon.rarity,
      stats: {
        assists: assists,
        goals: goals,
        plusMinus: plusMinus,
        shutouts: shutouts,
        wins: wins,
      },
      playerPos:cardPOS,
      team: decon.team,
      slug:HELPERS.generateSlug(pInfo.firstName,pInfo.lastName),
      capHit:salaryInfo.capHit,
      length:salaryInfo.length
    };
    return card;
  } catch (error) {
    console.log(`Error getcards from new ID ${error}`);
    return null;
  }
};
export const getTeamAbbrevsForToday = async (): Promise<string[]> => {
  try {
    const todaysApistring = HELPERS.getPFDateFromDate(new Date());
    // const todaysGames = await getNhlGamesByDay(todaysApistring.apiString);
    const gamesByDay = await fetch(
      `https://api-web.nhle.com/v1/schedule/${todaysApistring.apiString}`
    );
    const jData = await gamesByDay.json();
    const gamesIWant = jData.gameWeek.filter(
      (gday: any) => gday.date === todaysApistring.apiString
    );
    const todaysGames = gamesIWant[0].games;
    if (!todaysGames) throw new Error("🧭Error getting todays nhl games🧭");
    const teamAbbrevsPlayingTonight: string[] = [];

    todaysGames.forEach((g: any) => {
      teamAbbrevsPlayingTonight.push(g.awayTeam.abbrev);
      teamAbbrevsPlayingTonight.push(g.homeTeam.abbrev);
    });
    return teamAbbrevsPlayingTonight;
  } catch (error) {
    console.log(`Error getting abbrevs ${error}`);
    return [];
  }
};
export const getCardsFromIds = async(cards:string[]):Promise<PFCard[] | null> => {
  try {
    const tonightsTeams = await getTeamAbbrevsForToday();
    const dbgames = await getAllDBGames();
    if(!dbgames){throw new Error(`🚦 Could not get dbgames. 🚦`)}
    const allActiveGames = dbgames.filter((g)=>{HELPERS.isCurrentGame(g)});
    const newCards = await Promise.all(cards.map(async(cardid)=>{
      const nuCard = await getCardFromId(cardid,allActiveGames,tonightsTeams);
      if(!nuCard){throw new Error(`🚦Couldnt get card: ${cardid}🚦`)}
      return nuCard;
    }))
    return newCards;
  } catch (error) {
    console.log(`Error getting cards by ID: ${error}`)
    return null;
  }
}
export const getGamesByDayScore = async (
  day: string
): Promise<{ tonightsTeams: string[]; games: NHLGame[] } | null> => {
  try {
    const fRes = await fetch(`https://api-web.nhle.com/v1/score/${day}`);
    const fData = (await fRes.json()) as any;
    const tonightsTeams: string[] = [];
    const myGames: NHLGame[] = fData.games.map((g: any) => {
      tonightsTeams.push(g.awayTeam.abbrev);
      tonightsTeams.push(g.homeTeam.abbrev);
      return {
        id: g.id,
        date: g.gameDate,
        awayTeamAbb: g.awayTeam.abbrev,
        awayScore: g.awayTeam.score | 0,
        homeTeamAbb: g.homeTeam.abbrev,
        homeScore: g.homeTeam.score | 0,
        type: g.gameType,
      };
    });
    return { games: myGames, tonightsTeams: tonightsTeams };
  } catch (error) {
    console.log(`Could not get getGameDetails ${error}`);
    return null;
  }
};
export const botPickExperimental = (predict:PFPrediction):PFPrediction => {
const away = HELPERS.parseTeamRecord(predict.awayRecord);
  const home = HELPERS.parseTeamRecord(predict.homeRecord);
  
  const awayPerc = HELPERS.getPointsPercentage(away);
  const homePerc = HELPERS.getPointsPercentage(home);
  
  // 1. Apply Home Ice Advantage
  const HOME_ICE_BOOST = 0.03;
  const adjustedHomePerc = homePerc + HOME_ICE_BOOST;

  // 2. Create a "Probability Pool"
  // We add them together to see the total "strength" on the ice
  const totalPool = awayPerc + adjustedHomePerc;

  // 3. Roll the dice! 
  // Math.random() gives a number between 0 and 1.
  // We multiply it by the totalPool to get a "landing spot."
  const roll = Math.random() * totalPool;

  console.log(`System Analysis: Away (${(awayPerc * 100).toFixed(1)}%) vs Home (${(homePerc * 100).toFixed(1)}%)`);

  // 4. Determine the winner based on where the 'roll' landed
  // If the roll is less than the away team's strength, Away wins.
  // Otherwise, Home wins.
  const p = roll < awayPerc ? "AWAY" : "HOME";

  console.log(`🎲 Roll: ${roll.toFixed(2)} | Target: ${awayPerc.toFixed(2)} | Result: ${p}`);

  predict.prediction = p;
  return predict;
}
export const botPick = (predict:PFPrediction):PFPrediction=>{
    const away = HELPERS.parseTeamRecord(predict.awayRecord);
    const home = HELPERS.parseTeamRecord(predict.homeRecord);
    const awayPerc = HELPERS.getPointsPercentage(away);
    const homePerc = HELPERS.getPointsPercentage(home);
    const HOME_ICE_BOOST = 0.03;
    const adjustedHomePect = homePerc + HOME_ICE_BOOST;
    console.log(`System Analysis: Away (${(awayPerc * 100).toFixed(1)}%) vs Home (${(homePerc * 100).toFixed(1)}%)`);
    const p = adjustedHomePect >= awayPerc ? "HOME" : "AWAY";
    predict.prediction = p;
    return predict
  }
export async function runPredictorRepl(gameList: PFPrediction[]) {
  console.clear();
  console.log("🏒 --- NHL GAME PREDICTOR --- 🏒");
  console.log("Type 'h' for Home, 'a' for Away, or 'q' to Quit\n");

  for (const game of gameList) {
    // 1. Display game info to the user
    console.log(`📅 ${game.date} | ${game.desc}`);
    console.log(`   Away: ${game.awayRecord}  vs  Home: ${game.homeRecord}`);

    let validEntry = false;

    while (!validEntry) {
      // 2. Capture the keystroke
      const input = prompt("Your pick (h/a/q):")?.toLowerCase();

      if (input === 'q') {
        console.log("Exiting predictor...");
        return gameList; // Stop and return what we have
      }

      if (input === 'h') {
        game.prediction = "HOME";
        console.log("✅ Picked: HOME\n");
        validEntry = true;
      } else if (input === 'a') {
        game.prediction = "AWAY";
        console.log("✅ Picked: AWAY\n");
        validEntry = true;
      } else {
        console.log("❌ Invalid input. Use 'h', 'a', or 'q'.");
      }
    }
  }

  console.log("🏁 All games predicted!");
  return gameList;
}

export const getCardsWithPointsByDay = async(cards:string[],day:string):Promise<PFCard[] | null>=>{
  try {
    // const tonightsTeams = await getTeamAbbrevsForToday();
    // DO HAVE TO CHECK PF GAMES....
    const games = await getAllDBGames()
    if(!games){throw new Error(`🚦Couldbnt get games🚦`)}
    const relevantDBGames = games.filter(g => g.date === day);
    let arrayOfIds : string[] = [...new Set(cards)]
    arrayOfIds = arrayOfIds.filter((id) => id !== "defID");
    arrayOfIds = arrayOfIds.filter((id)=> id !== "defId");
    const myGames = await getGamesByDayScore(day);
    if (!myGames) {throw new Error(`Error gettiung games`)}
    const tonightsTeams = myGames.tonightsTeams;
    console.log(tonightsTeams);
    const relevantCardIds = cards.filter((c)=> tonightsTeams.includes(HELPERS.deconstructCardID(c).team))
    const teamLookup = new Set(tonightsTeams);
    const relevantGames = myGames.games.filter(g => 
      teamLookup.has(g.awayTeamAbb) || teamLookup.has(g.homeTeamAbb)
    );
    const allCards = await Promise.all(arrayOfIds.map(async(id)=>{
      const nc = await getCardFromId(id,relevantDBGames,tonightsTeams);
          if(!nc){throw new Error(`🚦Error getting card🚦`)}
          nc.stats.assists = 0;
          nc.stats.goals = 0;
          nc.stats.plusMinus = 0;
          nc.stats.shutouts = 0;
          nc.stats.wins = 0;
          nc.points = 0;
          return nc;
    }))
    let allAwayForwardsWithPoints: PFNhlStatType[] = [];
    let allAwayDefenseWithPoints: PFNhlStatType[] = [];
    let allAwayGoaliesWithPoints: PFNhlStatType[] = [];
    let allHomeForwardsWithPoints: PFNhlStatType[] = [];
    let allHomeDefenseWithPoints: PFNhlStatType[] = [];
    let allHomeGoaliesWithPoints: PFNhlStatType[] = [];

    const ng = await Promise.all(relevantGames.map(async(game)=>{
       const boxscore = await getGameByID(game.id);
        if (!boxscore) {throw new Error(`🚦Error getting boxscore🚦`)}
        const homeScore = boxscore.homeScore;
        const awayScore = boxscore.awayScore;
        const winnerIs = homeScore > awayScore ? "home" : "away";
        const allPlayersStats = boxscore.allPlayerStats;

        const awayForwardsWithPoints: PFNhlStatType[] =
          allPlayersStats.awayTeam.forwards.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "F",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });

        const awayDefenseWithPoints: PFNhlStatType[] =
          allPlayersStats.awayTeam.defense.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "D",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });
        const awayGoaliesWithPoints: PFNhlStatType[] =
          allPlayersStats.awayTeam.goalies.map((f: any) => {
            const timeOnIce = HELPERS.convertTimeToMinutes(f.toi);
            const pnst: PFNhlStatType = {
              assists: 0,
              goals: 0,
              id: f.playerId,
              plusMinus: 0,
              points: 0,
              pos: "G",
              shutout: f.goalsAgainst === 0 && timeOnIce > 9 ? 1 : 0,
              toi: f.toi,
              win: winnerIs === "away" && timeOnIce > 9 ? 1 : 0,
            };
            return pnst;
          });
        const homeForwardsWithPoints: PFNhlStatType[] =
          allPlayersStats.homeTeam.forwards.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "F",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });
        const homeDefenseWithPoints: PFNhlStatType[] =
          allPlayersStats.homeTeam.defense.map((f: any) => {
            const pnst: PFNhlStatType = {
              assists: f.assists,
              goals: f.goals,
              id: f.playerId,
              plusMinus: f.plusMinus,
              points: f.points,
              pos: "D",
              shutout: 0,
              toi: f.toi,
              win: 0,
            };
            return pnst;
          });
        const homeGoaliesWithPoints: PFNhlStatType[] =
          allPlayersStats.homeTeam.goalies.map((f: any) => {
            const timeOnIce = HELPERS.convertTimeToMinutes(f.toi);
            const pnst: PFNhlStatType = {
              assists: 0,
              goals: 0,
              id: f.playerId,
              plusMinus: 0,
              points: 0,
              pos: "G",
              shutout: f.goalsAgainst === 0 && timeOnIce > 9 ? 1 : 0,
              toi: f.toi,
              win: winnerIs === "home" && timeOnIce > 9 ? 1 : 0,
            };
            return pnst;
          });
        allAwayForwardsWithPoints = [
          ...allAwayForwardsWithPoints,
          ...awayForwardsWithPoints,
        ];
        allAwayDefenseWithPoints = [
          ...allAwayDefenseWithPoints,
          ...awayDefenseWithPoints,
        ];
        allAwayGoaliesWithPoints = [
          ...allAwayGoaliesWithPoints,
          ...awayGoaliesWithPoints,
        ];
        allHomeForwardsWithPoints = [
          ...allHomeForwardsWithPoints,
          ...homeForwardsWithPoints,
        ];
        allHomeDefenseWithPoints = [
          ...allHomeDefenseWithPoints,
          ...homeDefenseWithPoints,
        ];
        allHomeGoaliesWithPoints = [
          ...allHomeGoaliesWithPoints,
          ...homeGoaliesWithPoints,
        ];
        return game;
    }))
    const allForwards = [
      ...allAwayForwardsWithPoints,
      ...allHomeForwardsWithPoints,
    ];
    const allDefense = [
      ...allAwayDefenseWithPoints,
      ...allHomeDefenseWithPoints,
    ];

    const allGoalies = [
      ...allAwayGoaliesWithPoints,
      ...allHomeGoaliesWithPoints,
    ];
    
    const updatedCards :PFCard [] = allCards.map((c)=>{
      const n = Number(c.playerId);
      let isGoalie = false;
      if(c.playerPos === "D"){
          const defObj = allDefense.find(p => p.id === n);
          if(defObj){
              c.points = defObj.points;
              c.stats.assists = defObj.assists;
              c.stats.goals = defObj.goals;
              c.stats.plusMinus = defObj.plusMinus;
              }
      }else if(c.playerPos === "F"){
          const defObj = allForwards.find(p => p.id === n);
          if(defObj){
              c.points = defObj.points;
              c.stats.assists = defObj.assists;
              c.stats.goals = defObj.goals;
              c.stats.plusMinus = defObj.plusMinus;
              }
      }else if(c.playerPos === "G"){
        isGoalie = true;
          const defObj = allGoalies.find(p => p.id === n);
          if(defObj){
              c.stats.wins = defObj.win;
              c.stats.shutouts = defObj.shutout;
              c.points = defObj.win;
              
              }
      }
      const pnts = HELPERS.getPlayersTotalsWithRarity(HELPERS.deconstructCardID(c.cardId).rarity,c.stats,isGoalie);
      c.points = pnts;
      return c;
    })
    return updatedCards;
  } catch (error) {
    console.log(`🚦Could not get cards with points by day. ${error}🚦`)
    return null;
  }
}
export const HELPERS = {
  isPlayerAvailable:async(cardId:string,day:string)=>{
    try {
      let relevantGames = await getAllDBGames();
      if(!relevantGames){throw new Error(`🚦Could not get relevant games🚦`)}
      relevantGames = relevantGames.filter(g => g.date === day);
      let result = true;
      relevantGames.forEach((gm)=>{
        const crds = [gm.homeTeam.c,gm.homeTeam.d1,gm.homeTeam.d2,gm.homeTeam.g,gm.homeTeam.lw,gm.homeTeam.rw,gm.awayTeam.c,gm.awayTeam.d1,gm.awayTeam.d2,gm.awayTeam.g,gm.awayTeam.lw,gm.awayTeam.rw];
        if(crds.includes(cardId)){
          result = false;
        }
      })
    } catch (error) {
      console.log(`🚦Error checking player availability. ${error}🚦`);
      return false;
    }
  },
  createRandomID:(leng:number):string=>{
    let str = "";
    const possibleCharacters =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    for (let i = 0; i <= leng; i++) {
      const randomChar = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      str += randomChar;
    }
    return str;
  },
  getTimestamp:()=>{
    // 1. Get Time (7:26pm)
    const date = new Date()
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase().replace(/\s/g, ''); // removes space before pm

    // 2. Get Timezone (EST)
    const tz = date.toLocaleDateString('en-US', { day:'2-digit', timeZoneName: 'short' })
                 .split(' ').pop();

  // 3. Get Date (2026-01-04)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${timeStr} ${tz} ${year}-${month}-${day}`;
  },
  getPFDateFromDate:(d: Date):PFDate=>{
       const date = d;
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase().replace(/\s/g, ''); // removes space before pm
        // 2. Get Timezone (EST)
    const tz = date.toLocaleDateString('en-US', { day:'2-digit', timeZoneName: 'short' })
                 .split(' ').pop();
      // 3. Get Date (2026-01-04)

  // 3. Get Date (2026-01-04)
  const yearr = date.getFullYear();
  const monthh = String(date.getMonth() + 1).padStart(2, '0');
  const dayy = String(date.getDate()).padStart(2, '0');

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const workingDate = new Date(d);
    const monthNumber = workingDate.getMonth();

    const year = workingDate.getFullYear().toString();

    const dayNumber = workingDate.getDate();
    const month = months[monthNumber];
    const day = days[workingDate.getDay()];
    const ts =  `${timeStr} ${tz} ${day} ${year}-${monthh}-${dayy}`;
    const fd = `${day.toUpperCase()} ${month.toUpperCase()} ${dayNumber.toString()} ${year}`
    return {
      apiString: `${year}-${String(monthNumber + 1).padStart(2, "0")}-${String(
        dayNumber
      ).padStart(2, "0")}`,
      dateType: workingDate,
      day: day,
      dayNum: dayNumber,
      fullDate: ts,
      month: month,
      monthNum: monthNumber + 1,
      year: year,
      yearNum: workingDate.getFullYear(),
    };
  },
  isCurrentGame:(game:DBGame)=>{
      return ["Waiting for Game", "Waiting for Opponent"].includes(
      game.gameState
    );
  },
  deconstructCardID: (id: string): CardDecon => {
    const parts = id.split("-");

    const firstName = parts[0];
    const lastName = parts[1];
    const rarity = parseInt(parts[2], 10);
    const sweaterNumber = parseInt(parts[3], 10);
    const teamID = parseInt(parts[4], 10);
    const posID = parseInt(parts[5], 10);
    const playerID = parseInt(parts[6], 10);
    const metaID = parseInt(parts[7], 10);
    const year = parts[8];

    let rar: PFRarityType = "Standard";
    if (rarity === 10) {
      rar = "Unique";
    } else if (rarity === 8 || rarity === 9) {
      rar = "Super Rare";
    } else if (rarity >= 5 && rarity <= 7) {
      rar = "Rare";
    } else if (rarity <= 4) {
      rar = "Standard";
    }

    let pos: "C" | "L" | "R" | "D" | "G" = "C";
    const teamInfo = getTeamInfoByID(teamID);

    switch (posID) {
      case 1:
        pos = "C";
        break;
      case 2:
        pos = "L";
        break;
      case 3:
        pos = "R";
        break;
      case 4:
        pos = "D";
        break;
      case 5:
        pos = "G";
        break;
      default:
        break;
    }

    return {
      firstName,
      lastName,
      sweaterNumber,
      rarity: rar,
      team: teamInfo.abbrev,
      posID: pos,
      playerID: playerID.toString(),
      metaID,
      year,
    };
  },
  generateSlug:(first:string,last:string):string=>{
    const cleanPart = (name: string): string => {
      return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\./g, "-")             // Periods to hyphens
        .replace(/\s+/g, "-")            // Spaces to hyphens
        .split("'")                      // Split on apostrophe
        .join("-")                       // Join with hyphen
        .trim();
    };
    const fullName = `${cleanPart(first)}-${cleanPart(last)}`;
    return fullName.toLowerCase().replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  },
  emailUID:async(email:string):Promise<string>=>{
        // Convert the email string to a Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(email);

    // Generate a hash using SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert the hash to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    // Return the first 12 characters
    return hashHex.slice(0, 10);
  },
  convertTimeToMinutes: (time: string): number => {
    const [minutes, seconds] = time.split(":").map(Number);
    return minutes + seconds / 60;
  },
  getPlayersTotalsWithRarity:(rarity: PFRarityType,stats: PFStats,goalie: boolean):number=>{
        let pnts = 0;
    console.log(`Getting points with rarity`);
    if (goalie) {
      if (stats.shutouts === 1) {
        pnts = 5;
      } else if (stats.wins === 1) {
        pnts = 2;
      }
      switch (rarity) {
        case "Standard":
          break;
        case "Rare":
          pnts = pnts * PF_CONSTS.RARITY_VALUES.rare;
          break;
        case "Super Rare":
          pnts = pnts * PF_CONSTS.RARITY_VALUES.superRare;
          break;
        case "Unique":
          pnts = pnts * PF_CONSTS.RARITY_VALUES.unique;
          break;
        default:
          break;
      }
    } else {
      const pm = stats.plusMinus / 2;
      const totals = stats.goals + stats.assists + pm;
      switch (rarity) {
        case "Rare":
          pnts = totals * PF_CONSTS.RARITY_VALUES.rare;
          break;
        case "Standard":
          pnts = totals;
          break;
        case "Super Rare":
          pnts = totals * PF_CONSTS.RARITY_VALUES.superRare;
          break;
        case "Unique":
          pnts = totals * PF_CONSTS.RARITY_VALUES.unique;
          break;
        default:
          break;
      }
  
    }
    return pnts;
  },  
  displayGames: (date: string, scoreboard: NHLScoreboardResponse) => {
    try {
      const gamesForDate = scoreboard.gamesByDate.find(
        (gamesByDate) => gamesByDate.date === date
      );

      if (!gamesForDate) {
        console.log(`No games found for ${date}`);
        return;
      }

      console.log(`Games for ${date}`);

      gamesForDate.games.forEach((game) => {
        const now = new Date();
        const gameDate = new Date(game.startTimeUTC);
        const isFuture = gameDate > now;

        const awayTeamInfo = isFuture
          ? `${game.awayTeam.record || "N/A"}`
          : `${game.awayTeam.score ?? 0}`;
        const homeTeamInfo = isFuture
          ? `${game.homeTeam.record || "N/A"}`
          : `${game.homeTeam.score ?? 0}`;

        const gameLine = `${game.awayTeam.abbrev} (${awayTeamInfo}) @ ${game.homeTeam.abbrev} (${homeTeamInfo})`;

        // Convert start time to Eastern Time
        const easternTime = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(gameDate);

        console.log(gameLine);
        console.log(`Start Time (ET): ${easternTime}`);
        console.log(`Venue: ${game.venue.default}`);
        console.log("-".repeat(40));
      });
    } catch (error) {
      console.error("Error: ", error);
    }
  },
  parseTeamRecord:(rec:string)=>{
    // 1. Split the string by the hyphen
  // 2. Map over the strings to convert them to Numbers
  const [wins, losses, otl] = rec.split("-").map(Number);

  return {
    wins: wins || 0,   // Fallback to 0 if the string is empty or malformed
    losses: losses || 0,
    otl: otl || 0
  };
  },
  getPointsPercentage:(record:{wins:number,losses:number,otl:number})=>{
    const pointsEarned = (record.wins * 2) + record.otl;
    const gamesPlayed = record.wins + record.losses + record.otl;
    if (gamesPlayed === 0) return 0; // Prevent division by zero
    return pointsEarned / (gamesPlayed * 2);
  },

}
export const MASTER_ROSTER = {
  findSalaryById:(playerId:string):{capHit:number,length:number}|null=>{
    try {
      const n = Number(playerId)
      // const p = MasterRoster.find(p => p.id === n);
      // if(!p){throw new Error(`🚦COuldnt find player🚦`)}
      // return {capHit:p.capHit,length:p.length}
      return {
        capHit:PLAYER_REGISTRY.get(n)?.capHit ?? 0,
        length:PLAYER_REGISTRY.get(n)?.length ?? 0
      };
    } catch (error) {
      console.log(`COULDNT GET PLAYER salary BY ID ${error}`)
      return null;
    }
  },
  findProblems:()=>{

        let x = 'NONE';
        for (let index = 0; index < MasterRoster.length; index++) {
            const element = MasterRoster[index];
            if(!element.sweaterNumber){
                console.log(` FOUND ONE ${element.lastName}`)
                x = element.lastName;
            }
        }
        return x;
    },
  randomPlayer:():RosterPlayer=>{
    const players: RosterPlayer[] = MasterRoster;
    return players[Math.floor(Math.random()*players.length)]
  }
}
export const MINTED = {
    read:async():Promise<string[]>=>{
      const m = await DB.read('pfData','minted') as {cards:string[]}
      return m.cards;
    },
    create:async(quantity:number):Promise<string[] | null>=>{
        try {
            // first init. last init.  rarity. number.teamID, posID, playerID. meta. year.

            const minted = await DB.read('pfData','minted');
            const rarities = [{name:"Unique",num:10},{name:"Super Rare",num:9},{name:"Super Rare",num:8},{name:"Rare",num:7},{name:"Rare",num:6},{name:"Rare",num:5},{name:"Standard",num:4},{name:"Standard",num:3},{name:"Standard",num:2},{name:"Standard",num:1}]
            const posTypes = [{type:'C',id:1},{type:'L',id:2},{type:'R',id:3},{type:'D',id:4},{type:'G',id:5}]
            const allTeamAbbrevs:{abbrev:string,id:number}[] = [{abbrev:'UTA',id:68},{abbrev:'SEA',id:55},{abbrev:'VGK',id:54},{abbrev:'WPG',id:52},{abbrev:'MIN',id:30},{abbrev:'CBJ',id:29},{abbrev:'SJS',id:28},{abbrev:'LAK',id:26},{abbrev:'DAL',id:25},{abbrev:'ANA',id:24},{abbrev:'VAN',id:23},{abbrev:'EDM',id:22},{abbrev:'COL',id:21},{abbrev:'CGY',id:20},{abbrev:'STL',id:19},{abbrev:'NSH',id:18},{abbrev:'DET',id:17},{abbrev:'CHI',id:16},{abbrev:'WSH',id:15},{abbrev:'TBL',id:14},{abbrev:'FLA',id:13},{abbrev:'CAR',id:12},{abbrev:'TOR',id:10},{abbrev:'NJD',id:1},{abbrev:'NYI',id:2},{abbrev:'NYR',id:3},{abbrev:'PHI',id:4},{abbrev:'PIT',id:5},{abbrev:'BOS',id:6},{abbrev:'BUF',id:7},{abbrev:'MTL',id:8},{abbrev:'OTT',id:9}]

            const getInitials = (name: string) => {
                return name.split('-').map(part => part[0]).join('');
            };
            //This should be in a while loop
            let q = 0;
            const cardIdArray :string[] = [];
            while(q < quantity){
              const randomPlayer = MASTER_ROSTER.randomPlayer();
              const randomRarity = rarities[Math.floor(Math.random()*rarities.length)]
              const firstInitial = getInitials(randomPlayer.firstName)
              const lastInitial = getInitials(randomPlayer.lastName);
              const sweaterNumber = randomPlayer.sweaterNumber.toString().padStart(2,'0');
              const rarity = randomRarity.num.toString().padStart(2,'0');
              const teamID = allTeamAbbrevs.find(a => a.abbrev === randomPlayer.team)?.id.toString().padStart(2,'0');
              const posID = posTypes.find(p => p.type === randomPlayer.position)?.id.toString().padStart(2,'0');
              const playerID = randomPlayer.id.toString()
              const metaID = '00';
              const year = '26'
              const newCardID = `${firstInitial}-${lastInitial}-${rarity}-${sweaterNumber}-${teamID}-${posID}-${playerID}-${metaID}-${year}`;
              
              if(minted.cards.includes(newCardID)){
                console.log(`INVALID ID GO AGAIN`)
              }else{
                console.log(`VALID ID`)
                cardIdArray.push(newCardID);
                q++;
              }
              
            }
        
            await DB.update('pfData','minted',{cards:[...minted.cards,...cardIdArray]})

            return cardIdArray;


            
        } catch (error) {
            console.log(`Error minting ${error}`)
            return null;
        }
    },
    exists:async(cardID:string):Promise<boolean>=>{
        const minted = await DB.read('pfData','minted');
        return minted.cards.includes(cardID);
      },
    add:async(cardID:string):Promise<boolean>=>{
        try {
          const minted = await DB.read('pfData','minted');
          const r = await DB.update('pfData','minted',{cards:[...minted.cards,cardID]})
          if(!r){throw new Error('🚦 Could not update 🚦')}
          return true;
        } catch (error) {
          console.log(`Error Updating minted ${error}`)
          return false;
        }
      }
}
export const USERS = {
    signup:async(email:string):Promise<DBUserData | null>=>{
        try {
            const userID = await HELPERS.emailUID(email) 
      
            const userCheck = await DB.read('users',email) as DBUserData | null;
          
            if(userCheck){throw new Error("🚦USER EXISTS🚦")}
          
            const usr :DBUserData = {
                activeGameIds:[],
                activeLeagueIds:[],
                activeTrades:[],
                avatar:PF_CONSTS.DEFAULT_AVATAR,
                cards:[],
                displayName:email,
                email:email,
                friends:[],
                pastGameIds:[],
                pucks:0,
                tradingBlockIds:[],
                id:userID
            }
            const res = await DB.create('users',email,usr);
            if(!res){throw new Error("Could not save.")}
            await LOG.createLogFile(email,`${email} signed up.`)
            await DB.create("chirps",email,{all:[]}) 
            // await DB.makeFolder(userID);
            await DB.create(`predictions-${userID}`,"stats",{wins:0,losses:0,winningDays:0,losingDays:0})
            return usr;
        } catch (error) {
            console.log(`Error SIGNING UP ${error}`)
            return null;
        }
    },
    login:async(email:string):Promise<DBUserData | null>=>{
        try {
            const userID = await HELPERS.emailUID(email) 
            console.log(`Logging in uid: ${userID}`)
            const userCheck = await DB.read('users',userID) as DBUserData | null;
            if(!userCheck){throw new Error(`Error getting user`)}
            const t :PFTx = {
              by:PF_CONSTS.APP_NAME,
              cards:[],
              from:PF_CONSTS.APP_NAME,
              id:HELPERS.createRandomID(8),
              regarding:'Login',
              state:'complete',
              to:userID,
              tx:false,
              type:'login',
              value:0,
              whatHappened:`${email} logged in.`,
              when:HELPERS.getPFDateFromDate(new Date).fullDate
            }
            await LOG.add(userID,t);
            return userCheck;
        } catch (error) {
            console.log(`Error logging in ${error}`)
            return null;
        }
    },
    updateDisplayName:async(username:string,displayName:string):Promise<boolean>=>{
      try {
        const allNames = await DB.read("pfData","displayNames") as {all:string[]} | null;
        if(!allNames){throw new Error(`🚦 Could not get displaynames 🚦`)}
        const userdata = await DB.read("users",username) as DBUserData | null;
        if(!userdata){throw new Error(`🚦Error getting userdata 🚦`)}
        if(allNames.all.includes(displayName)){throw new Error(`🚦Name exists already🚦`)}
        const newNames = allNames.all.filter((n)=> n !== userdata.displayName);
        newNames.push(displayName)
        const userUpdate = await DB.update("users",username,{displayName:displayName});
        if(!userUpdate){throw new Error(`🚦Could not update user🚦`)}
        return true;
      } catch (error) {
        console.log(`Error updating display name ${error}`)
        return false;
      }
    }
}
export const MARKET = {
  purchaseCards:async(email:string,quantity:number,cost:number):Promise<string[] | null>=>{
    try {
      const username = await HELPERS.emailUID(email);
      const userdata = await DB.read("users",email) as DBUserData | null;
      if(!userdata){throw new Error(`🚦Could not read userdata🚦`)}
      const usersBalance = userdata.pucks - cost;
      if(usersBalance < 0){throw new Error(`🚦User does nt have enough pucks for this. 🚦`)}
      const newCards = await MINTED.create(quantity);
      if(!newCards){throw new Error('🚦Couldnt get new cards.🚦')}
      const updUsr = await DB.update('users',email,{pucks:usersBalance,cards:[...userdata.cards,...newCards]})
      if(!updUsr){throw new Error('🚦Error updating userdata.🚦')}
      const tx:PFTx = {
        by:PF_CONSTS.APP_NAME,
        cards:newCards,
        from:PF_CONSTS.APP_NAME,
        id:HELPERS.createRandomID(8),
        regarding:'Card Purchase',
        state:'complete',
        to:email,
        tx:true,
        type:'buyCards',
        value:cost,
        whatHappened:`${username} bought ${quantity} cards for ${cost} pucks.`,
        when:HELPERS.getPFDateFromDate(new Date).fullDate
      }
      await LOG.add(email,tx);
      return newCards;
    } catch (error) {
      console.log(`Couldnt purchase cards ${error}`)
      return null;
    }
  },
  purchasePucks:async(email:string,pucks:number):Promise<boolean>=>{
    try {
      const username = await HELPERS.emailUID(email)
      const prevData = await DB.read('users',email) as DBUserData | null;
      if(!prevData){throw new Error(`🚦Could not read user data 🚦`)}
      const newPucks = prevData.pucks + pucks;
      const updRes = await DB.update('users',email,{pucks:newPucks})
      if(!updRes){throw new Error(`🚦 Couldnt Update User 🚦`)}
      const tx :PFTx = {
        by:PF_CONSTS.APP_NAME,
        cards:[],
        from:PF_CONSTS.APP_NAME,
        id:HELPERS.createRandomID(8),
        regarding:'Puck Purchase',
        state:'complete',
        to:email,
        tx:true,
        type:'buyPucks',
        value:pucks,
        whatHappened:`${username} purchased ${pucks} pucks.`,
        when:HELPERS.getPFDateFromDate(new Date).fullDate
      }
      await LOG.add(email,tx);
      return true;
    } catch (error) {
      console.log(`Error buying pucks ${error}`);
      return false;
    }
  },
  putCardsOnTradingBlocks:()=>{},
  cancelTradeOrSale:()=>{},
  offerTrade:()=>{},
  declineOffer:()=>{},
  acceptOffer:()=>{},
  cancelOffer:()=>{},
  buyCardFromSeller:()=>{},
  counterOffer:()=>{},
  declineCounterOffer:()=>{}

}
export const GAMES = {
  create:async(team:PFTeamIds,user:DBUserData,value:number,open:boolean,priv:boolean):Promise<DBGame | null>=>{
    try {
      const dbg :DBGame = {
        awayId:"defId",
        awayName:"",
        awayScore:0,
        awayTeam:{c:"defID",d1:"defID",d2:"defID",g:"defID",lw:"defID",m:"defID",rw:"defID"},
        date:HELPERS.getPFDateFromDate(new Date).apiString,
        gameState:"Waiting for Opponent",
        homeId:user.id,
        homeName:user.displayName,
        homeScore:0,
        homeTeam:team,
        id:HELPERS.createRandomID(8),
        open:open,
        private:priv,
        value:value
      }
      const newPucks = user.pucks - value;
      if(newPucks < 0){throw new Error(`🚦User does not have enough pucks.🚦`)}
      const storeGame = await DB.create("games",dbg.id,dbg);
      if(!storeGame){throw new Error(`🚦Couldnt save game🚦`)}
      const newGameIds = [...user.activeGameIds,dbg.id];
      const updUsr = await DB.update("users",user.id,{activeGameIds:newGameIds,pucks:newPucks})
      if(!updUsr){throw new Error(`🚦Couldnt update user🚦`)}
      const createGameTx :PFTx = {
        by:PF_CONSTS.APP_NAME,
        cards:[team.c,team.d1,team.d2,team.g,team.lw,team.rw],
        from:PF_CONSTS.APP_NAME,
        id:HELPERS.createRandomID(8),
        regarding:dbg.id,
        state:'complete',
        to:user.email,
        tx:true,
        type:'createGame',
        value:value,
        whatHappened:`${user.email} created game ${dbg.id}`,
        when:HELPERS.getPFDateFromDate(new Date).apiString,

      }
      await LOG.add(user.id,createGameTx);
      return dbg;
    } catch (error) {
      console.log(`Couldnt create game ${error}`)
      return null;
    }
  },
  join:async(gameID: string,
    email: string,
    team: PFTeamIds): Promise<DBGame | null>=>{
      try {
        const userID = await HELPERS.emailUID(email);
        const gameFromDb = await DB.read("games",gameID) as DBGame | null;
        if (!gameFromDb) {throw new Error(`Error getting game from db`)}
        const joiningUser = await DB.read("users",userID) as DBUserData | null;
        const homeUser = await DB.read("users",gameFromDb.homeId) as DBUserData | null;
        if(!joiningUser || !homeUser){throw new Error(`🚦Couldnt get user(s)🚦`)}
        const newJoiningUserPucks = joiningUser.pucks - gameFromDb.value;
        if(newJoiningUserPucks < 0){throw new Error(`🚦You do not have enough pucks🚦`)}
        const newGamesArray = [...joiningUser.activeGameIds,gameID];
        gameFromDb.gameState = "Waiting for Game";
        gameFromDb.awayId = userID;
        gameFromDb.awayName = joiningUser.displayName;
        gameFromDb.awayTeam = team;
        const updUser = await DB.update("users",userID,{activeGameIds:newGamesArray,pucks:newJoiningUserPucks});
        if(!updUser){throw new Error("🚦Coulnd update user🚦")}
        const updateGame = await DB.update("games",gameFromDb.id,{gameState: "Waiting for Game",awayId: userID,awayName: joiningUser.displayName,awayTeam: team})
        if(!updateGame){throw new Error(`🚦Couldnt update game🚦`)}
        // SEND CHIRP
        const ch :DBChirp = {
          content:`${email} joined game ${gameID}.`,
          date:new Date,
          from:email,
          id:HELPERS.createRandomID(8),
          isChirp:false,
          regarding:"game",
          regardingId:gameID,
          seen:false,
          state:"complete",
          to:gameFromDb.homeId,
          type:"gameJoined",
          regardingId2:""
        }
        const joinGameTx :PFTx = {
          by:PF_CONSTS.APP_NAME,
          cards:[],
          from:PF_CONSTS.APP_NAME,
          id:HELPERS.createRandomID(8),
          regarding:gameID,
          state:'complete',
          to:userID,
          tx:true,
          type:'joinGame',
          value:gameFromDb.value,
          whatHappened:`${email} joined game ${gameID}.`,
          when:HELPERS.getPFDateFromDate(new Date).apiString
        }
        await LOG.add(userID,joinGameTx)
        await CHIRPS.send(ch);
        console.log(`Game Joined Successfully by ${email}`);
        return gameFromDb
      } catch (error) {
        console.log(`COuld not join game: ${error}`)
        return null;
      }
    },
  cancel:()=>{},
  calculateGameByDay:async(day:string)=>{
    try {
      const games = await getAllDBGames()
      if(!games){throw new Error(`🚦Couldbnt get games🚦`)}
      const relevantGames = games.filter(g => g.date === day);
      if(relevantGames.length > 0){
        const cGames = await Promise.all(relevantGames.map(async(gm)=>{
          return await calculateGame(gm);
        }))
          for (const cg of cGames) {
            if(!cg){throw new Error(`🚦No CG in for loop🚦`)}
            const updRes = await updateDataAfterGameCalc(cg);
            if (!updRes) {
              throw new Error(`Error updating post: ${cg.id}`);
            }
        }
      }else{
        console.log(`🚦No Games to Calculate🚦`)
      }
      console.log(`GOT GAMES:`)
      return true;
    } catch (error) {
      console.log(`🚦Couldnt calc game by day. ${error} 🚦`)
      return null;
    }
  },
  read:()=>{}
}
export const LOG = {
  createLogFile:async(userID:string,log:string)=>{
    try {
      const t :PFTx = {
        by:"Puckface",
        cards:[],
        from:"Puckface",
        id:HELPERS.createRandomID(8),
        regarding:"signup",
        state:"complete",
        to:userID,
        tx:false,
        type:"signup",
        value:0,
        whatHappened:log,
        when:HELPERS.getPFDateFromDate(new Date).fullDate,
        freeAgents:[]
      }
   
      const result = await DB.create('logs',userID,{all:[t]})
      if(!result){throw new Error(`🚦Could not create Log file. 🚦`)}
      return true;
    } catch (error) {
      console.log(`Could Not create Log File ${error}`)
      return false;
    }
  },
  add:async(email:string,log:PFTx)=>{
    try {
      // const userID = await HELPERS.emailUID(email)
      console.log(`ADDING LOG TO USER: ${email}`)
      const userslogs = await DB.read('logs',email) as {all:string[]} | null;
      if(!userslogs){throw new Error(`🚦Could not read logs ${email}🚦`)}
      const upd = await DB.update('logs',email,{all:[...userslogs.all,log]})
      if(!upd){throw new Error(`🚦Error updating user logs🚦`)}
      return true;
    } catch (error) {
      console.log(`Error adding log to file ${error}`)
      return false;
    }
  }
}
export const NHL = {
  getAllPlayers:()=>{},
  getAllSalariesByTeam:()=>{},
  compareCards:(card1:PFCard,card2:PFCard)=>{
    let txt = '';
    if(card1.points > card2.points){txt='Card 1 Wins'}else if(card1.points === card2.points){txt='Cards Tied'}else{txt='Card 2 Wins'}
    return txt;
  },
  getNhlGamesWithRecords:async(apiString:string)=>{
            try {
            const d = await fetch(`https://api-web.nhle.com/v1/scoreboard/now`);
            const e = await d.json() as any;
            const f = e.gamesByDate as any[];
    
            const g = f.filter(h => h.date === apiString)
            const nhlgames :NHLGameWithRecord[] = g[0].games.map((gm:any) => {
                const nn :NHLGameWithRecord = {
                    awayTeamName:gm.awayTeam.name.default,
                    awayLogo:gm.awayTeam.logo,
                    awayRecord:gm.awayTeam.record ?? `Shots: ${gm.awayTeam.sog}`,
                    awayTeamAbb:gm.awayTeam.abbrev,
                    homeTeamName:gm.homeTeam.name.default,
                    homeLogo:gm.homeTeam.logo,
                    homeRecord:gm.homeTeam.record ?? `Shots: ${gm.homeTeam.sog}`,
                    homeTeamAbb:gm.homeTeam.abbrev,
                    gameId:gm.id,
                    link:gm.gameCenterLink
                }
                return nn;
            })
            return nhlgames;
        } catch (er) {
            console.log(`Error getting gaems with records ${er}`);
            return [];
        }
  }
}
export const CHIRPS = {
  send: async (chirp: DBChirp): Promise<boolean> => {
    try {
      const prevChirps = await DB.read("chirps",chirp.to) as {all:DBChirp[]} | null;
      if (!prevChirps) {throw new Error(`Could not get chirps`);}
      const newChirps = [chirp, ...prevChirps.all];
      const updatedResult = await DB.update("chirps", chirp.to, {
        all: newChirps,
      });
      if (!updatedResult) {
        throw new Error(`Error Updating chirps`);
      }
      return true;
    } catch (error) {
      console.log(`Failed to send chirp: ${error}`);
      return false;
    }
  },
  getAllByUserID:async(userID:string):Promise<DBChirp[]>=>{
    try { 
      const userChirps = await DB.read('chirps',userID) as {all:DBChirp[]} | null;
      if(!userChirps){throw new Error(`🚦Eror getting chirps or no chirps to be had🚦`)}
      return userChirps.all;
    } catch (error) {
      console.log(`Eror getting chiprs: ${error}`)
      return [];
    }
  },
  markAsSeen:async(userID:string,chirpID:string):Promise<boolean>=>{
    try {
      const allUsersChirps = await DB.read('chirps',userID) as {all:DBChirp[]} | null;
      if(!allUsersChirps){throw new Error(`Eror getting chirps or no chirps to be had`)}
      const newChirpArray = allUsersChirps.all.map((chirp) => 
        chirp.id === chirpID ? { ...chirp, seen: true } : chirp
      );
      const updateChirpsinDB = await DB.update('chirps',userID,{all:newChirpArray})
      if(!updateChirpsinDB){throw new Error(`🚦Error updating chirps🚦`)}
      return true;
    } catch (error) {
      console.log(`Error marking as seen ${error}`)
      return false;
    }
  }
}
export const PREDICTOR = {
  fromExperimental:async(email:string,day:string)=>{
    try {
           const userID = await HELPERS.emailUID(email)
      const scoreboard = await getNHLScoreboard()
      if(!scoreboard){throw new Error(`🚦Couldnt get scoreboard🚦`)}
      const gamesForDate = scoreboard.gamesByDate.find((gamesByDate)=> gamesByDate.date === day)
      if(!gamesForDate){throw new Error(`🚦Couldnt get games by date🚦`)}
      const predixArray :PFPrediction[] = gamesForDate.games.map((game)=>{
          console.log(`ID:${game.id} ${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`)
          return {result:'NONE',date:day,gameID:game.id,prediction:'NONE',user:userID,desc:`${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`,awayRecord:game.awayTeam.record ?? '0-0-0',homeRecord:game.homeTeam.record ?? '0-0-0'}
          })
      const botArray:PFPrediction[] = predixArray.map((pfg)=>{
          return botPickExperimental(pfg)
        })
      const p2s = {day:day,predictions:botArray}
      const upd = await DB.create(`predictions${userID}`,day,p2s)
      if(!upd){throw new Error(`🚦COULD NOT CREATE FILE PREDICT🚦`)}
      console.log(" REPL SUCCESS");
    } catch (error) {
      console.log(`🚦Could not get experimental picks: ${error}🚦`)
    }
  },
  fromBots:async(email:string,day:string)=>{
    try {
      const userID = await HELPERS.emailUID(email)
      const scoreboard = await getNHLScoreboard()
      if(!scoreboard){throw new Error(`🚦Couldnt get scoreboard🚦`)}
      const gamesForDate = scoreboard.gamesByDate.find((gamesByDate)=> gamesByDate.date === day)
      if(!gamesForDate){throw new Error(`🚦Couldnt get games by date🚦`)}
      const predixArray :PFPrediction[] = gamesForDate.games.map((game)=>{
          console.log(`ID:${game.id} ${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`)
          return {result:'NONE',date:day,gameID:game.id,prediction:'NONE',user:userID,desc:`${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`,awayRecord:game.awayTeam.record ?? '0-0-0',homeRecord:game.homeTeam.record ?? '0-0-0'}
          })
      const botArray:PFPrediction[] = predixArray.map((pfg)=>{
          return botPick(pfg)
        })
      const p2s = {day:day,predictions:botArray}
      const upd = await DB.create(`predictions${userID}`,day,p2s)
      if(!upd){throw new Error(`🚦COULD NOT CREATE FILE PREDICT🚦`)}
      console.log(" REPL SUCCESS");
    } catch (error) {
      console.log(`🚦ERRROR FROM BOTS ${error}🚦`)
    }

  },
  fromRepl:async(email:string,day:string)=>{
    try {
          const userID = await HELPERS.emailUID(email)
          const scoreboard = await getNHLScoreboard()
          if(!scoreboard){throw new Error(`🚦Couldnt get scoreboard🚦`)}
          const gamesForDate = scoreboard.gamesByDate.find((gamesByDate)=> gamesByDate.date === day)
          if(!gamesForDate){throw new Error(`🚦Couldnt get games by date🚦`)}
          const predixArray :PFPrediction[] = gamesForDate.games.map((game)=>{
                console.log(`ID:${game.id} ${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`)
                      return {result:'NONE',date:day,gameID:game.id,prediction:'NONE',user:userID,desc:`${game.awayTeam.abbrev} @ ${game.homeTeam.abbrev}`,awayRecord:game.awayTeam.record ?? '0-0-0',homeRecord:game.homeTeam.record ?? '0-0-0'}
              })
          const gl = await runPredictorRepl(predixArray);
          console.log(gl);
          const o2s = {day:day,predictions:gl}
          const upd = await DB.create(`predictions${userID}`,day,o2s)    
          if(!upd){throw new Error(`🚦COULD NOT CREATE FILE PREDICT🚦`)}
          console.log(" REPL SUCCESS");
    } catch (error) {
      console.log(`🚦ERROR IN REPL ${error}🚦`)
    }
    

  },
  calculatePicksByUserAndDay:async(email:string,day:string):Promise<boolean>=>{
    try {
      const userID = await HELPERS.emailUID(email)
      // const pix = await DB.read(`predictions-${userID}`,day) as {day:string,predictions:PFPrediction[]} | null;
      const pix = await DB.read(`predictions-${userID}`,day);
      if(!pix){throw new Error(`🚦Couldnt get pix🚦`)}

      const stats = {correct:0,incorrect:0}
      const calcedGames = await Promise.all(pix.predictions.map(async(p:any)=>{
        const getGame = await fetch(`https://api-web.nhle.com/v1/gamecenter/${p.gameID.toString()}/landing`)
        if (!getGame.ok) {throw new Error("Failed to fetch NHL scoreboard data")}
        const gameData = await getGame.json();
        const gameIsFuture = gameData.gameState === "FUT" ? true : false;
        const gameIsOver = gameData.gameState === "OFF" ? true : false;
        console.log(`Game: ${gameData.id}. Home: ${gameData.homeTeam.score} Away:${gameData.awayTeam.score}`)
        if(gameData.homeTeam.score > gameData.awayTeam.score){
          p.result = "HOME";
          if(p.prediction === "HOME"){stats.correct++}else{stats.incorrect++}
        }
        if(gameData.awayTeam.score > gameData.homeTeam.score){
          p.result = "AWAY";
          if(p.prediction === "AWAY"){stats.correct++}else{stats.incorrect++}
        }
        return p;
      }))
      const usersStats = await DB.read(`predictions-${userID}`,"stats") as {wins:number,losses:number,winningDays:number,losingDays:number} | null;
      if(!usersStats){throw new Error(`🚦Couldnt get users stats🚦`)}
      const newUsersStats = {wins:usersStats.wins + stats.correct,losses:usersStats.losses + stats.incorrect, winningDays:stats.correct > stats.incorrect ? usersStats.winningDays + 1 : usersStats.winningDays,losingDays:stats.incorrect >= stats.correct ? usersStats.losingDays + 1 : usersStats.losingDays}
      const updateUsersStats = await DB.update(`predictions${userID}`,"stats",newUsersStats);
      const updateUsersPredictions = await DB.update(`predictions${userID}`,day,{predictions:calcedGames})
      console.log(stats);
      const ch :DBChirp = {
        content:`You predicted ${stats.correct} games correctly, and ${stats.incorrect} incorrectly.`,
        date:new Date,
        from:PF_CONSTS.APP_NAME,
        id:HELPERS.createRandomID(8),
        isChirp:false,
        regarding:'admin',
        regardingId:day,
        seen:false,
        state:'complete',
        to:userID,
        type:'message'
      }
      await CHIRPS.send(ch);
      return true;
    } catch (error) {
      console.log(`Could not calc picks ${error}`)
      return false;
    }
  }
}
export const LEAGUES = {
  phl:{
    join:async(email:string)=>{
      const userID = await HELPERS.emailUID(email);
      const phl = await DB.read("leagues","phl") as PFLeague | null;
      if(!phl){throw new Error(`🚦COuldnt read league🚦`)}
      const newMember : PFLeagueMembers = {
        games:[],
        record:"0-0-0",
        userID:userID
      }
      const usr = await DB.read("users",userID) as DBUserData | null;
      if(!usr){throw new Error(`🚦COuldnt get user data🚦`)}
      const updusr = await DB.update("users",userID,{activeLeagueIds:["phl",...usr.activeLeagueIds]})
      const newPhlMembers = [newMember,...phl.members]
      const upd = await DB.update("leagues","phl",{members:newPhlMembers})
      console.log(phl)
    }
  },
  custom:{
    create:async(email:string,leagueName:string,buyIn:number,free:boolean,open:boolean,priv:boolean,winningCondition:"SEASON" | "DAILY"):Promise<PFLeague | null>=>{

      try {
        const userID = await HELPERS.emailUID(email);
        const l :PFLeague = {
          games:[],
          id:HELPERS.createRandomID(8),
          members:[{games:[],record:"0-0-0",userID:userID}],
          name:leagueName,
          rules:{buyIn:buyIn,free:free,open:open,private:priv,winningCondition:winningCondition}
        }  
        const usr = await DB.read("users",userID) as DBUserData | null;
        if(!usr){throw new Error(`🚦Couldnt read user🚦`)}
        const created = await DB.create("leagues",l.id,l);
        const updusr = await DB.update("users",userID,{activeLeagueIds:[l.id,...usr.activeLeagueIds]})

      } catch (error) {
        console.log(`🚦Error creating league ${error}🚦`)
        return null;
      }
    }
  }
}
export const TESTS = {
  showNHLGames:()=>{
    showNHLGames("2026-01-08")
  },
  calculate:async()=>{
    try {
      const today = "2026-01-11";
      const yesterday = "2026-01-06";//Happy Birthday Mom!!
      
      const calcu = await GAMES.calculateGameByDay(today)
      console.log(`Calcu:`)
      console.log(calcu);
      return `SUCCESS`;
    } catch (error) {
      console.log(`Error Testing Calc ${error}`)
      return `SOMETHING WENT WRONG`;
    }
  },
  start:async()=>{
    try {
      const emails = {
        mario:"mario@mario.com",
        luigi:"luigi@luigi.com",
        yoshi:"yoshi@yoshi.com"
      }
      // const defPhl : PFLeague = {
      //   games:[],
      //   id:'phl',
      //   members:[],
      //   name:'PHL'
      // }
      // const eraseLogs = await JSONOPS.clearFolder("logs")
      // const eraseLeagues = await JSONOPS.clearFolder("leagues")
      // const eraseUsers = await JSONOPS.clearFolder("users")
      // const eraseGames = await JSONOPS.clearFolder("games")
      // const erasePredix = await JSONOPS.clearFolder("predictions")
      // const clearMinted = await JSONOPS.update("pfData","minted",{cards: ["defID"]})
      // const resetPhl = await JSONOPS.create("leagues","phl",defPhl)
      const resetData = await DB.clearAllData()
      const marioID = await HELPERS.emailUID(emails.mario)
      const luigiID = await HELPERS.emailUID(emails.luigi)
      const yoshiID = await HELPERS.emailUID(emails.yoshi)
      const sMario = await USERS.signup(emails.mario)
      const sLuigi = await USERS.signup(emails.luigi)
      const sYoshi = await USERS.signup(emails.yoshi)
      const pMario = await MARKET.purchasePucks(emails.mario,100)
      const pLuigi = await MARKET.purchasePucks(emails.luigi,100)
      const pYoshi = await MARKET.purchasePucks(emails.yoshi,100)
      const cMario = await MARKET.purchaseCards(emails.mario,20,10)
      const cLuigi = await MARKET.purchaseCards(emails.luigi,20,10)
      const cYoshi = await MARKET.purchaseCards(emails.yoshi,20,10)
      const userMario = await USERS.login(emails.mario)
      const userLuigi = await USERS.login(emails.luigi)
      const userYoshi = await USERS.login(emails.yoshi)
      if(!userMario || !userLuigi || !userYoshi){throw new Error(`🚦Couldnt get users🚦`)}
      const marioTeam :PFTeamIds = {c:userMario.cards[0],d1:userMario.cards[1],d2:userMario.cards[2],g:userMario.cards[3],lw:userMario.cards[4],rw:userMario.cards[5]}
      const luigiTeam :PFTeamIds = {c:userLuigi.cards[0],d1:userLuigi.cards[1],d2:userLuigi.cards[2],g:userLuigi.cards[3],lw:userLuigi.cards[4],rw:userLuigi.cards[5]}
      const yoshiTeam :PFTeamIds = {c:userYoshi.cards[0],d1:userYoshi.cards[1],d2:userYoshi.cards[2],g:userYoshi.cards[3],lw:userYoshi.cards[4],rw:userYoshi.cards[5]}
      const marioTeam2 :PFTeamIds = {c:userMario.cards[6],d1:userMario.cards[7],d2:userMario.cards[8],g:userMario.cards[9],lw:userMario.cards[10],rw:userMario.cards[11]}
      const luigiTeam2 :PFTeamIds = {c:userLuigi.cards[6],d1:userLuigi.cards[7],d2:userLuigi.cards[8],g:userLuigi.cards[9],lw:userLuigi.cards[10],rw:userLuigi.cards[11]}
      const yoshiTeam2 :PFTeamIds = {c:userYoshi.cards[6],d1:userYoshi.cards[7],d2:userYoshi.cards[8],g:userYoshi.cards[9],lw:userYoshi.cards[10],rw:userYoshi.cards[11]}
      const marioGame = await GAMES.create(marioTeam,userMario,5,true,false);
      const luigiGame = await GAMES.create(luigiTeam,userLuigi,5,true,false)
      const yoshiGame = await GAMES.create(yoshiTeam,userYoshi,5,true,false)
      if(!marioGame || !luigiGame || !yoshiGame){throw new Error(`🚦COuldnt create games🚦`)}
      const luigiAtMario = await GAMES.join(marioGame.id,emails.luigi,luigiTeam2)
      const yoshiAtLuigi = await GAMES.join(luigiGame.id,emails.yoshi,yoshiTeam2)
      const marioAtYoshi = await GAMES.join(yoshiGame.id,emails.mario,marioTeam2)
      const luigiPredict = await PREDICTOR.fromBots(emails.luigi,"2026-01-12")
      const yoshiPredict = await PREDICTOR.fromExperimental(emails.yoshi,"2026-01-12")
      const marioPredict = await PREDICTOR.fromRepl(emails.mario,"2026-01-12")
     
      return true;
    } catch (error) {
      console.log(`COULDNT RUN START TEST ${error}`)
      return false;
    }
  },
  test:async()=>{
    try {
      
    } catch (error) {
      console.log(`🚦ERROR TESTS: ${error}🚦`);
    }
  }
}
