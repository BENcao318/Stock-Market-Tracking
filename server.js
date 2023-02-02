let WebSocketServer = require('ws').Server
let fs = require('fs')
let account = require('./account')
const myAccount = new account.Account('Demo Account')

let stocks
try {
  stocks = JSON.parse(fs.readFileSync('stocks.json'))
  console.log('Successfully loaded stocks data.')
} catch {
  throw Error('Could not load stocks data.')
}
let stockSymbols = stocks.map((stock) => stock.symbol)
console.log(`Supported stock symbols: ${stockSymbols}`)

let wss = new WebSocketServer({ port: 8080 })

console.log('WebSocket server is listening on port 8080.')

let getConnectedEvent = () => {
  let event = {
    event: 'connected',
    supportedSymbols: stockSymbols,
    message: 'Stock database is connected',
  }
  return JSON.stringify(event)
}

let getDisconnectingEvent = (reason) => {
  let event = {
    event: 'disconnecting',
    reason: reason,
  }
  return JSON.stringify(event)
}

let getErrorEvent = (reason) => {
  let event = {
    event: 'error',
    reason: reason,
  }
  return JSON.stringify(event)
}

let getStocksUpdateEvent = (connectionInfo) => {
  let event = {
    event: 'stocks-update',
    stocks: {},
  }

  connectionInfo.stocksToWatch.forEach((stock) => {
    let stockInfo = stocks.find((e) => e.symbol === stock)
    if (stockInfo) {
      let priceDataLength = stockInfo.priceData.length
      if (connectionInfo.stocksUpdateCount >= priceDataLength) {
        connectionInfo.stocksUpdateCount = 0
      }
      event.stocks[stock] =
        stockInfo.priceData[connectionInfo.stocksUpdateCount].price
    }
  })
  return JSON.stringify(event)
}

let disconnect = (ws, reason) => {
  ws.send(getDisconnectingEvent(reason))
  ws.terminate()
}

let handleSubscribe = (ws, parsedMessage, connectionInfo) => {
  if (parsedMessage.stocks instanceof Array) {
    parsedMessage.stocks.forEach((stock) => {
      if (stocks.some((e) => e.symbol === stock)) {
        if (!connectionInfo.stocksToWatch.includes(stock)) {
          connectionInfo.stocksToWatch.push(stock)
        }
        myAccount.addSubscription(stock)
      } else {
        ws.send(getErrorEvent('invalid stock symbol'))
      }
    })
  } else {
    ws.send(getErrorEvent('invalid message'))
  }
}

let handleLogin = (ws) => {
  myAccount.logIn()
  if (myAccount.logInStatus) {
    ws.send(JSON.stringify('You are signed in!'))
  } else {
    ws.send(JSON.stringify('You are signed out'))
  }
}

let handleLogout = (ws) => {
  myAccount.logOut()
  if (myAccount.logInStatus) {
    ws.send(JSON.stringify('You are signed in!'))
  } else {
    ws.send(JSON.stringify('You are signed out!'))
  }
}

let handleDeposit = (ws, parsedMessage) => {
  if (parsedMessage.amount) {
    if (parsedMessage.amount > 0) {
      const deposit = new account.Deposit(parsedMessage.amount, myAccount)
      deposit.commit()
      ws.send(JSON.stringify(`Deposit ${parsedMessage.amount} to your account`))
    } else {
      ws.send(getErrorEvent('invalid ammount of deposit'))
    }
  } else {
    ws.send(getErrorEvent('invalid message'))
  }
}

let handleBuyShares = (ws, parsedMessage) => {
  if (parsedMessage.amount && parsedMessage.stock) {
    const transaction = new account.BuyShares(
      parsedMessage.stock,
      parsedMessage.amount,
      myAccount
    )
    if (transaction.commit()) {
      ws.send(
        JSON.stringify(
          `Successfully bought ${parsedMessage.amount} shares of ${parsedMessage.stock} to your account`
        )
      )
    } else {
      ws.send(getErrorEvent('invalid ammount of stocks'))
    }
  } else {
    ws.send(getErrorEvent('invalid message'))
  }
}

let handleSellShares = (ws, parsedMessage) => {
  if (parsedMessage.amount && parsedMessage.stock) {
    const transaction = new account.SellShares(
      parsedMessage.stock,
      parsedMessage.amount,
      myAccount
    )
    if (transaction.commit()) {
      ws.send(
        JSON.stringify(
          `Successfully sold ${parsedMessage.amount} shares of ${parsedMessage.stock} from your account`
        )
      )
    } else {
      ws.send(getErrorEvent('invalid ammount of stocks'))
    }
  } else {
    ws.send(getErrorEvent('invalid message'))
  }
}

let handleViewPortfolio = (ws, parsedMessage) => {
  let portfolio = {
    stocks: myAccount.stocks,
    balance: myAccount.balance,
    subscriptions: myAccount.subscriptions,
  }
  ws.send(JSON.stringify(portfolio))
}

wss.on('connection', (ws) => {
  ws.send(getConnectedEvent())

  let connectionInfo = {
    isActive: true,
    stocksToWatch: [],
    stocksUpdateCount: 0,
  }

  ws.pingInterval = setInterval(() => {
    if (!connectionInfo.isActive) {
      disconnect(ws, 'connection inactive')
    } else {
      connectionInfo.isActive = false
      ws.ping()
    }
  }, 15000)

  ws.stocksInterval = setInterval(() => {
    if (connectionInfo.stocksToWatch.length > 0) {
      ws.send(getStocksUpdateEvent(connectionInfo))
      connectionInfo.stocksUpdateCount += 1
    }
  }, 6000)

  ws.connectionTimeout = setTimeout(() => {
    disconnect(ws, 'connection time exceeds 5 minutes')
  }, 300000)

  ws.on('message', (message) => {
    connectionInfo.isActive = true

    if (message.length > 300) {
      ws.send(getErrorEvent('message too long'))
      return
    }

    let parsedMessage
    try {
      parsedMessage = JSON.parse(message)
    } catch {
      ws.send(getErrorEvent('invalid message'))
      return
    }

    if (parsedMessage.event === 'subscribe') {
      handleSubscribe(ws, parsedMessage, connectionInfo)
    }

    if (parsedMessage.event === 'signin') {
      handleLogin(ws)
    } else if (parsedMessage.event === 'signout') {
      handleLogout(ws)
    }

    if (parsedMessage.event === 'add balance') {
      handleDeposit(ws, parsedMessage)
    }

    if (parsedMessage.event === 'buy shares') {
      handleBuyShares(ws, parsedMessage)
    } else if (parsedMessage.event === 'sell shares') {
      handleSellShares(ws, parsedMessage)
    }

    if (parsedMessage.event === 'view portfolio') {
      handleViewPortfolio(ws, parsedMessage)
    }
  })

  ws.on('close', () => {
    clearInterval(ws.pingInterval)
    clearInterval(ws.stocksInterval)
    clearTimeout(ws.connectionTimeout)
  })

  ws.on('pong', () => {
    connectionInfo.isActive = true
  })
})
