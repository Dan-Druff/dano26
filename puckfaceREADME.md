# DATABASE SHAPES
## users > [email].json = DBUserData
## userAuth > [email] = User
## pfData > displayNames.json = {"all":['sample name']}
## pfData > minted.json = {"cards": ["defID"]}
## forTrade > [tradeID] = DBTradeSell
## forSale > [saleID] = DBTradeSell
## games > [gameID] = DBGame
## leagues > [leagueID] = DBLeague
## logs > [userID].json = {"all":[PFTx]}
## chirps > [userID].json = {"all": [DBChirp]}
## sessions > [sessionId] = {email,createdAt},{expireIn:1000*60*24*2}
## predictions${userId} > [stats] = {wins:0,losses:0,winningDays:0,losingDays:0}
## predictions${userId} > [day] = PFPrediction[]
