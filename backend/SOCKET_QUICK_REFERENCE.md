# Socket.IO Quick Reference Card

## Connection Setup
```javascript
const socket = io('http://localhost:8000', {
  auth: {
    userId: 'your-user-id',
    userName: 'Your Name'
  }
});
```

---

## 📤 Client → Server Events (Emit)

### JOIN_AUCTION
Join an auction room to receive updates
```javascript
socket.emit('JOIN_AUCTION', {
  itemId: 'auction-item-uuid'
});
```

### PLACE_BID
Place a bid on an auction item
```javascript
socket.emit('PLACE_BID', {
  itemId: 'auction-item-uuid',
  amount: 5250.00
});
```

### LEAVE_AUCTION
Leave an auction room
```javascript
socket.emit('LEAVE_AUCTION', {
  itemId: 'auction-item-uuid'
});
```

### GET_BID_HISTORY
Request bid history for an item
```javascript
socket.emit('GET_BID_HISTORY', {
  itemId: 'auction-item-uuid'
});
```

---

## 📥 Server → Client Events (Listen)

### AUCTION_STATE
Received when joining an auction
```javascript
socket.on('AUCTION_STATE', (data) => {
  console.log(data.item);
});
```

### BID_SUCCESS
Your bid was placed successfully
```javascript
socket.on('BID_SUCCESS', (data) => {
  console.log('Bid placed!', data.item, data.bidRecord);
});
```

### BID_ERROR
Your bid failed
```javascript
socket.on('BID_ERROR', (data) => {
  console.error(data.error, data.errorCode);
});
```
**Error Codes:** `BID_TOO_LOW`, `SELF_OUTBID`, `AUCTION_ENDED`, `BID_FAILED`

### BID_UPDATE
Broadcast when any bid is placed
```javascript
socket.on('BID_UPDATE', (data) => {
  console.log('New bid:', data.item, data.bidder);
});
```

### OUTBID_NOTIFICATION
You have been outbid
```javascript
socket.on('OUTBID_NOTIFICATION', (data) => {
  if (data.userId === myUserId) {
    console.log('Outbid!', data.newAmount);
  }
});
```

### BID_HISTORY
Response to GET_BID_HISTORY
```javascript
socket.on('BID_HISTORY', (data) => {
  console.log(data.history);
});
```

### TIME_WARNING
Auction ending soon (< 60 seconds)
```javascript
socket.on('TIME_WARNING', (data) => {
  console.log(`${data.timeRemaining} seconds left`);
});
```

### AUCTION_ENDED
Auction has ended
```javascript
socket.on('AUCTION_ENDED', (data) => {
  console.log('Winner:', data.winner);
});
```

---

## 🔧 Testing Tools

### Option 1: Node.js Script
```bash
npm install socket.io-client node-fetch
node test-socket-client.js
```

### Option 2: Browser Console
```javascript
// Load Socket.IO client
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(script);

// After script loads
const socket = io('http://localhost:8000', {
  auth: { userId: 'test123', userName: 'Test User' }
});

socket.on('connect', () => console.log('Connected!'));
```

### Option 3: Postman
1. New → WebSocket Request
2. URL: `ws://localhost:8000`
3. Note: Postman doesn't support Socket.IO auth handshake natively

---

## 📋 Common Workflows

### Test Bidding Flow
```javascript
// 1. Connect
const socket = io('http://localhost:8000', {
  auth: { userId: 'user123', userName: 'John' }
});

// 2. Join auction
socket.on('connect', () => {
  socket.emit('JOIN_AUCTION', { itemId: 'item-id' });
});

// 3. Listen for state
socket.on('AUCTION_STATE', (data) => {
  const newBid = data.item.currentBid + 1.00;
  
  // 4. Place bid
  socket.emit('PLACE_BID', {
    itemId: data.item.id,
    amount: newBid
  });
});

// 5. Handle success/error
socket.on('BID_SUCCESS', (data) => {
  console.log('Success!', data);
});

socket.on('BID_ERROR', (data) => {
  console.error('Failed:', data.error);
});
```

---

## ⚙️ Configuration

### Environment Variables
```bash
PORT=8000
MIN_BID_INCREMENT=1.00
AUCTION_EXTENSION_SECONDS=30
LAST_MINUTE_THRESHOLD_SECONDS=60
```

### Rate Limits
- Window: 60 seconds
- Max Requests: 100 per window
- Applies to REST API only (not WebSocket)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection rejected | Add `userId` and `userName` to auth |
| "Bid too low" | Bid must be ≥ currentBid + $1.00 |
| "Already highest bidder" | Can't outbid yourself |
| "Auction ended" | Auction time expired |

---

## 📚 Resources

- **Full Guide:** [`API_TESTING_GUIDE.md`](./API_TESTING_GUIDE.md)
- **Test Script:** [`test-socket-client.js`](./test-socket-client.js)
- **Postman Collection:** [`postman-collection.json`](./postman-collection.json)
- **Source Code:** [`src/sockets/socketHandlers.js`](./src/sockets/socketHandlers.js)
