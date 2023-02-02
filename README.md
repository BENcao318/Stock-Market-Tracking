# Stock-Market-Tracking

- For creating stocks data, use `node createStock.js` and create a json file that contains 60 random stocks
- This API use websocket to set up the connection and provide live stock rates.

## Setups

```
git clone git@github.com:BENcao318/Stock-Market-Tracking.git Stock-Market-Tracking
cd Stock-Market-Tracking
npm install
node createStock.js
```

## API Endpoints

Suggest to use postman or any other api client to build up the connection with websocket server.
Port: 8080, ip address: use following wsl code for getting your local machine ip address:

```
wsl -- ip -o -4 -json addr list eth0
```

Example Url:  
`ws://172.24.97.169:8080`

### Once the websocket connection is set up, use the following messages for different endpoints:

- User sign in: receive message "You are signed in!" if success

```
  {
    "event": "signin"
  }
```

- User sign out: receive message "You are signed out!" if success

```
  {
    "event": "signout"
  }
```

- Add balance: receive message "Deposit 6000 to your account" if success

```
  {
    "event": "add balance",
    "amount": 6000
  }
```

- Buy shares: receive message "Successfully bought 6000 shares of VJ to your account" if success

```
  {
    "event": "buy shares",
    "amount": 6000,
    "stock": ["VJ"]
  }
```

- Sell shares: receive message "Successfully sold 3000 shares of VJ from your account" if success

```
  {
    "event": "sell shares",
    "amount": 3000,
    "stock": ["VJ"]
  }
```

- Subscribe live update: successfully send will give the server permission to continuously send the update of the selected stock price in the message every 6 seconds

```
  {
    "event": "subscribe",
    "stocks": ["VJ"]
  }
```

- View portfolio: will send back the current portfolio of the user:

```
{
    "stocks": {
        "VJ": 3000
    },
    "balance": 6000,
    "subscriptions": [
        "VJ"
    ]
}
```

```
  {
    "event": "view portfolio"
  }
```
