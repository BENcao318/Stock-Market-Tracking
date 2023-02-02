class BalanceTransaction {
  constructor(amount, account) {
    this.account = account
    this.amount = amount
  }

  commit() {
    if (this.isAllowed()) {
      this.time = new Date()
      this.account.addTransaction(this)
      return true
    } else {
      return false
    }
  }

  isAllowed() {
    if (this.account.balance + this.value >= 0) {
      return true
    } else {
      return false
    }
  }
}

class Withdrawal extends BalanceTransaction {
  get value() {
    return -this.amount
  }
}

class Deposit extends BalanceTransaction {
  get value() {
    return this.amount
  }
}

class Account {
  constructor(username) {
    this.username = username
    this.isLoggedIn = false
    this.transactions = []
    this.subscriptions = []
    this.stocks = {}
  }

  get balance() {
    let balance = 0
    for (let t of this.transactions) {
      balance += t.value
    }
    return balance
  }

  get logInStatus() {
    return this.isLoggedIn
  }

  logIn() {
    this.isLoggedIn = true
  }

  logOut() {
    this.isLoggedIn = false
  }

  addSubscription(stock) {
    if (!this.subscriptions.includes(stock)) {
      this.subscriptions.push(stock)
    }
  }

  addTransaction(transaction) {
    this.transactions.push(transaction)
  }
}

class StockTransaction {
  constructor(stockName, amount, account) {
    this.stockName = stockName
    this.amount = amount
    this.account = account
    if (!this.account.stocks[this.stockName]) {
      this.account.stocks[this.stockName] = 0
    }
  }

  commit() {
    if (this.account.stocks[this.stockName] + this.value >= 0) {
      this.account.stocks[this.stockName] += this.value
      return true
    } else {
      return false
    }
  }
}

class BuyShares extends StockTransaction {
  get value() {
    return this.amount
  }
}

class SellShares extends StockTransaction {
  get value() {
    return -this.amount
  }
}

module.exports = { Account, Deposit, BuyShares, SellShares }
// DRIVER CODE BELOW
// We use the code below to "drive" the application logic above and make sure it's working as expected
// const myAccount = new Account('snow-patrol')

// t1 = new Withdrawal(50.25, myAccount)
// console.log('commit result:', t1.commit())
// console.log('Transaction 1:', t1.value)

// t2 = new Withdrawal(9.99, myAccount)
// console.log('commit result:', t2.commit())
// console.log('Transaction 2:', t2.value)

// console.log('Balance:', myAccount.balance)

// t3 = new Deposit(120.0, myAccount)
// console.log('commit result:', t3.commit())
// console.log('Transaction 3:', t3.value)

// t4 = new Withdrawal(40.0, myAccount)
// console.log('commit result:', t4.commit())
// console.log('Transaction 4:', t4.value)

// console.log('Balance:', myAccount.balance)

// console.log('Account Transaction History:', myAccount.transactions)

// t1 = new BuyShares('testStock1', 10, myAccount)
// console.log('commit result:', t1.commit())
// console.log('Transaction 1:', t1.value)
// // console.log('Transaction stock name:', t1.stockName)
// console.log('Account', myAccount.stocks)
// t2 = new SellShares('testStock1', 11, myAccount)
// console.log('commit result:', t2.commit())
// console.log('Transaction 1:', t2.value)
// console.log('Account', myAccount.stocks)
// myAccount.addSubscription('testStock')
// console.log(myAccount.subscriptions)
