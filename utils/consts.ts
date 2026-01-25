export type User = {
  id: string
  email: string,
  hashedPassword:string,
  createdAt:string

}

export type Session = {
  userId: string
  createdAt: number
}
export type PFRarityType = "Standard" | "Rare" | "Super Rare" | "Unique";
export type PFGamePosType = "NONE" | "LW" | "C" | "RW" | "D1" | "D2" | "G";
export type PFPosType = "F" | "D" | "G";
export type TxType = "login" | "error" | "signup" | "changeName" | "gameOver" | "message" | "acceptInvite" |"invitePlayer"|"removeFreeAgent"|"joinLeague"|"createLeague"|"declineOffer"|"counterOffer"|"acceptOffer"|"submitOffer"|"buyFreeAgent"|"submitFreeAgent"|"tieGame"|"loseGame"|"winGame"|"joinGame"|"createGame"|"buyCards"|"buyPucks";
export type ChirpState = "pending" | "complete";
export type ChirpRegarding = "trade" | "purchase" | "game" | "admin";
export type ChirpType =
  | "message"
  | "inviteAccepted"
  | "leagueJoined"
  | "offerSubmitted"
  | "offerDeclined"
  | "offerCountered"
  | "offerAccepted"
  | "freeAgentBought"
  | "tiedGame"
  | "loseGame"
  | "winGame"
  | "gameJoined"
  | "boughtPucks"
  | "boughtCards"
  | "signup"
  | "removeFreeAgent";
export type PFGameState =
  | "Waiting for Opponent"
  | "Waiting for Game"
  | "Away Team Wins"
  | "Home Team Wins"
  | "Complete"
  | "Initialized"
  | "Tied";
  export interface NHLGameWithRecord {
    awayTeamName:string,
    homeTeamName:string,
    awayTeamAbb:string,
    homeTeamAbb:string,
    awayLogo:string,
    homeLogo:string,
    awayRecord:string,
    homeRecord:string,
    gameId:string,
    link:string
  }
export interface PFLeagueRules {
  private:boolean,
  free:boolean,
  open:boolean,
  buyIn:number,
  winningCondition:"SEASON" | "DAILY",
}
export interface PFLeagueMembers {
  userID:string,
  record:string,
  games:string[]
}
export interface PFLeague {
  name:string,
  id:string,
  members:PFLeagueMembers[],
  games:string[],
  rules:PFLeagueRules
  }
export interface DBChirp {
  id: string;
  from: string;
  to: string;
  regarding: ChirpRegarding;
  regardingId: string;
  regardingId2?: string;
  content: string;
  date: Date;
  isChirp: boolean;
  state: ChirpState;
  type: ChirpType;
  seen: boolean;
}
export interface TvBroadcast {
  id: number; // 324
  market: string; // "N"
  countryCode: string; // "US"
  network: string; // "NHLN"
  sequenceNumber: number; // 23
}
export interface LocalizedName {
  default: string; // "Chicago Blackhawks"
  fr?: string; // "Blackhawks de Chicago"
}
export interface Team {
  id: number; // 16
  name: LocalizedName;
  commonName: LocalizedName;
  placeNameWithPreposition: LocalizedName;
  abbrev: string; // "CHI"
  record?: string;
  score?: number; // 1
  logo: string; // "https://assets.nhle.com/logos/nhl/svg/CHI_light.svg"
}
export interface Game {
  id: number; // 2024020474
  season: number; // 20242025
  gameType: number; // 2
  gameDate: string; // "2024-12-14"
  gameCenterLink: string; // "/gamecenter/chi-vs-njd/2024/12/14/2024020474"
  venue: Venue;
  startTimeUTC: string; // "2024-12-14T18:00:00Z"
  easternUTCOffset: string; // "-05:00"
  venueUTCOffset: string; // "-05:00"
  tvBroadcasts: TvBroadcast[];
  gameState: string; // "OFF"
  gameScheduleState: string; // "OK"
  awayTeam: Team;
  homeTeam: Team;
  ticketsLink?: string;
  ticketsLinkFr?: string;
  period: number; // 3
  periodDescriptor: PeriodDescriptor;
  threeMinRecap?: string;
  threeMinRecapFr?: string;
}
export interface PFPrediction {
    date:string,
    gameID:number,
    prediction:'HOME' | 'AWAY' | 'NONE',
    user:string,
    desc:string,
    homeRecord:string,
    awayRecord:string,
    result:'HOME'|'AWAY'|'NONE'
}
export interface GameByDate {
  date: string; // "2024-12-14"
  games: Game[];
}
export interface NHLScoreboardResponse {
  focusedDate: string; // "2024-12-17"
  focusedDateCount: number; // 7
  gamesByDate: GameByDate[];
}
  export interface Venue {
  default: string; // "Prudential Center"
}
export interface VenueLocation {
  default: string;
}
export interface TVBroadcast {
  id: number;
  market: string;
  countryCode: string;
  network: string;
  sequenceNumber: number;
}
export interface PeriodDescriptor {
  number: number; // 3
  periodType: string; // "REG"
  maxRegulationPeriods: number; // 3
}
export interface GTeam {
  id: number;
  commonName: {
    default: string;
  };
  abbrev: string;
  score: number;
  sog: number; // shots on goal
  logo: string;
  darkLogo: string;
  placeName: {
    default: string;
  };
  placeNameWithPreposition: {
    default: string;
    fr: string;
  };
}
export interface Clock {
  timeRemaining: string;
  secondsRemaining: number;
  running: boolean;
  inIntermission: boolean;
}
export interface PlayerStats {
  playerId: number;
  sweaterNumber: number;
  name: {
    default: string;
    [key: string]: string;
  };
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number; // penalty minutes
  hits: number;
  powerPlayGoals: number;
  sog: number;
  faceoffWinningPctg: number;
  toi: string; // time on ice
  blockedShots: number;
  shifts: number;
  giveaways: number;
  takeaways: number;
}
export interface GoalieStats {
  playerId: number;
  sweaterNumber: number;
  name: {
    default: string;
  };
  position: string;
  evenStrengthShotsAgainst: string;
  powerPlayShotsAgainst: string;
  shorthandedShotsAgainst: string;
  saveShotsAgainst: string;
  evenStrengthGoalsAgainst: number;
  powerPlayGoalsAgainst: number;
  shorthandedGoalsAgainst: number;
  pim: number;
  goalsAgainst: number;
  toi: string;
  starter: boolean;
  shotsAgainst: number;
  saves: number;
  savePctg?: number; // optional, as not all goalies have save percentage
  decision?: string; // e.g., 'W', 'L'
}
export interface PlayerByGameStats {
  forwards: PlayerStats[];
  defense: PlayerStats[];
  goalies: GoalieStats[];
}
export interface NHLGameData {
  id: number;
  season: number;
  gameType: number;
  limitedScoring: boolean;
  gameDate: string;
  venue: Venue;
  venueLocation: VenueLocation;
  startTimeUTC: string;
  easternUTCOffset: string;
  venueUTCOffset: string;
  tvBroadcasts: TVBroadcast[];
  gameState: string;
  gameScheduleState: string;
  periodDescriptor: PeriodDescriptor;
  regPeriods: number;
  awayTeam: GTeam;
  homeTeam: GTeam;
  clock: Clock;
  playerByGameStats: {
    awayTeam: PlayerByGameStats;
    homeTeam: PlayerByGameStats;
  };
}
  export interface NHLGame {
    id:number,
    date:string,
    awayTeamAbb:string,
    awayScore:number,
    homeTeamAbb:string,
    homeScore:number,
    type:number
}
export interface PFStats {
  goals: number;
  assists: number;
  plusMinus: number;
  wins: number;
  shutouts: number;
}
export type CardDecon = {
  firstName: string;
  lastName: string;
  sweaterNumber: number;
  rarity: PFRarityType;
  team: string;
  posID: "C" | "L" | "R" | "D" | "G";
  playerID: string;
  metaID: number;
  year: string;
};
export interface PFCard {
    firstName:string,
    lastName:string,
    slug:string,
    cardId:string,
    playerId:string,
    rarity:PFRarityType,
    playerPos: PFPosType,
    inGameId:string,
    inGamePos: PFGamePosType,
    avatar:string,
    points:number,
    playingTonight:boolean,
    team:string,
    sweaterNumber:number,
    stats:PFStats,
    capHit:number,
    length:number
}
export interface RosterPlayer {
      id: number,
    firstName: string,
    lastName: string,
    sweaterNumber: number,
    position: string,
    team: string,
    length: number,
    capHit: number,
    slug: string
}
export interface DBUserData {
  activeGameIds: string[];
  activeLeagueIds: string[];
  pastGameIds: string[];
  avatar: string;
  cards: string[];
  displayName: string;
  email: string;
  friends: string[];
  pucks: number;
  tradingBlockIds: string[];
  activeTrades:string[];
  id:string;
}
export interface PFTx {
    by:string,
    from:string,
    to:string,
    id:string,
    regarding:string,
    state:ChirpState,
    cards:string[],
    type:TxType,
    value:number,
    when:string,
    freeAgents?:string[],
    tx:boolean,
    whatHappened:string,
    mBool?:boolean,
    mString?:string
}
export interface PFDate {
  month: string;
  day: string;
  year: string;
  apiString: string;
  dateType: Date;
  monthNum: number;
  yearNum: number;
  dayNum: number;
  fullDate: string;
}
export interface PFTeamCards {
    lw:PFCard,
    c:PFCard,
    rw:PFCard,
    d1:PFCard,
    d2:PFCard,
    g:PFCard,
    m:PFCard
}
export interface PFNhlStatType {
    id:number,
    goals:number,
    assists:number,
    plusMinus:number,
    points:number,
    win:number,
    shutout:number,
    toi:string,
    pos:'F' | 'D' | 'G'
}
export interface PFTeamIds {
  lw: string;
  c: string;
  rw: string;
  d1: string;
  d2: string;
  g: string;
  m?: string;
}
export interface DBGame {
  homeScore: number;
  awayScore: number;
  awayId: string;
  homeId: string;
  homeName: string;
  awayName: string;
  awayTeam: PFTeamIds;
  homeTeam: PFTeamIds;
  date: string;
  gameState: PFGameState;
  id: string;
  open: boolean;
  private: boolean;
  value: number;
}
export const allTeamAbbrevs:{abbrev:string,id:number}[] = [{abbrev:'UTA',id:68},{abbrev:'SEA',id:55},{abbrev:'VGK',id:54},{abbrev:'WPG',id:52},{abbrev:'MIN',id:30},{abbrev:'CBJ',id:29},{abbrev:'SJS',id:28},{abbrev:'LAK',id:26},{abbrev:'DAL',id:25},{abbrev:'ANA',id:24},{abbrev:'VAN',id:23},{abbrev:'EDM',id:22},{abbrev:'COL',id:21},{abbrev:'CGY',id:20},{abbrev:'STL',id:19},{abbrev:'NSH',id:18},{abbrev:'DET',id:17},{abbrev:'CHI',id:16},{abbrev:'WSH',id:15},{abbrev:'TBL',id:14},{abbrev:'FLA',id:13},{abbrev:'CAR',id:12},{abbrev:'TOR',id:10},{abbrev:'NJD',id:1},{abbrev:'NYI',id:2},{abbrev:'NYR',id:3},{abbrev:'PHI',id:4},{abbrev:'PIT',id:5},{abbrev:'BOS',id:6},{abbrev:'BUF',id:7},{abbrev:'MTL',id:8},{abbrev:'OTT',id:9}]

export const nobodyCard: PFCard = {
  cardId: "defID",
  firstName: "Blank",
  lastName: "SELECT",
  avatar: "/images/PFeMOJI3.png",
  inGameId: "",
  inGamePos: "NONE",
  playerPos:"F",
  playerId: "defID",
  playingTonight: false,
  points: 0,
  rarity: "Standard",
  stats: {
    assists: 0,
    goals: 0,
    plusMinus: 0,
    shutouts: 0,
    wins: 0,
  },
  sweaterNumber: 69,
  team: "NHL",
  slug:"NA",
  capHit:0,
  length:0
};
export const PF_CONSTS = {
    APP_NAME:'Puckface',
    PACK_QUANTITY:8,
    PRICE_PER_PACK:10,
    DEFAULT_AVATAR:`/images/pFeMOJI3.png`,
    DEF_CARD_ID:'defID',
    RARITY_VALUES:{
        standard:1,
        rare:1.5,
        superRare:2,
        unique:4
    },
    NOBODY_CARD:nobodyCard,
    

}
export const nobodyTeam : PFTeamCards = {
    lw:{
      cardId:'defID',
      firstName:'Select',
      lastName:'Player',
      avatar:'/images/PFeMOJI3.png',
      inGameId:'',
      inGamePos:'LW',
      playerPos:'F',
      playerId:'defID',
      playingTonight:true,
      points:0,
      rarity:'Standard',
      stats:{
        assists:0,
        goals:0,
        plusMinus:0,
        shutouts:0,
        wins:0
      },
      sweaterNumber:69,
      team:'NHL',
      capHit:0,
      length:0,
      slug:'defID'
    },
    c:{
      cardId:'defID',
      firstName:'Select',
      lastName:'Player',
      avatar:'/images/PFeMOJI3.png',
      inGameId:'',
      inGamePos:'C',
      playerPos:'F',
      playerId:'defID',
      playingTonight:true,
      points:0,
      rarity:'Standard',
      stats:{
        assists:0,
        goals:0,
        plusMinus:0,
        shutouts:0,
        wins:0
      },
      sweaterNumber:69,
      team:'NHL',
          capHit:0,
      length:0,
      slug:'defID'
    },rw:{
      cardId:'defID',
      firstName:'Select',
      lastName:'Player',
      avatar:'/images/PFeMOJI3.png',
      inGameId:'',
      inGamePos:'RW',
      playerPos:'F',
      playerId:'defID',
      playingTonight:true,
      points:0,
      rarity:'Standard',
      stats:{
        assists:0,
        goals:0,
        plusMinus:0,
        shutouts:0,
        wins:0
      },
      sweaterNumber:69,
      team:'NHL',
          capHit:0,
      length:0,
      slug:'defID'
    },d1:{
      cardId:'defID',
      firstName:'Select',
      lastName:'Player',
      avatar:'/images/PFeMOJI3.png',
      inGameId:'',
      inGamePos:'D1',
      playerPos:'D',
      playerId:'defID',
      playingTonight:true,
      points:0,
      rarity:'Standard',
      stats:{
        assists:0,
        goals:0,
        plusMinus:0,
        shutouts:0,
        wins:0
      },
      sweaterNumber:69,
      team:'NHL',
          capHit:0,
      length:0,
      slug:'defID'
    },d2:{

      cardId:'defID',
      firstName:'Select',
      lastName:'Player',
      avatar:'/images/PFeMOJI3.png',
      inGameId:'',
      inGamePos:'D2',
      playerPos:'D',
      playerId:'defID',
      playingTonight:true,
      points:0,
      rarity:'Standard',
      stats:{
        assists:0,
        goals:0,
        plusMinus:0,
        shutouts:0,
        wins:0
      },
      sweaterNumber:69,
      team:'NHL',
          capHit:0,
      length:0,
      slug:'defID'
    },g:{

      cardId:'defID',
      firstName:'Select',
      lastName:'Player',
      avatar:'/images/PFeMOJI3.png',
      inGameId:'',
      inGamePos:'G',
      playerPos:'G',
      playerId:'defId',
      playingTonight:true,
      points:0,
      rarity:'Standard',
      stats:{
        assists:0,
        goals:0,
        plusMinus:0,
        shutouts:0,
        wins:0
      },
      sweaterNumber:69,
      team:'NHL',
          capHit:0,
      length:0,
      slug:'defID'
    },m:{

      cardId:'defId',
      firstName:'Select',
      lastName:'Player',
      avatar:'/images/PFeMOJI3.png',
      inGameId:'',
      inGamePos:'LW',
      playerPos:'F',
      playerId:'defId',
      playingTonight:true,
      points:0,
      rarity:'Standard',
      stats:{
        assists:0,
        goals:0,
        plusMinus:0,
        shutouts:0,
        wins:0
      },
      sweaterNumber:69,
      team:'NHL',
          capHit:0,
      length:0,
      slug:'defID'
    }
  }