# Testing Resources for Live Auction Platform Backend

This directory contains comprehensive testing resources for the Live Auction Platform API.

## 📁 Files Overview

### Documentation
- **[`API_TESTING_GUIDE.md`](./API_TESTING_GUIDE.md)** - Complete guide for testing REST API and Socket.IO events
- **[`SOCKET_QUICK_REFERENCE.md`](./SOCKET_QUICK_REFERENCE.md)** - Quick reference card for Socket.IO events
- **[`env-usage-analysis.md`](./env-usage-analysis.md)** - Analysis of environment variables usage

### Testing Tools
- **[`test-socket-client.js`](./test-socket-client.js)** - Interactive Node.js Socket.IO test client
- **[`postman-collection.json`](./postman-collection.json)** - Postman collection for REST API testing

---

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
npm install
npm start
```
Server will run on `http://localhost:8000`

### 2. Test REST API with Postman

**Import Collection:**
1. Open Postman
2. Click **Import**
3. Select `postman-collection.json`
4. Collection will appear in your sidebar

**Run Requests:**
1. Start with "Get All Auction Items" to populate the `itemId` variable
2. Use other endpoints to test functionality

### 3. Test Socket.IO Events

**Option A: Using the Test Script (Recommended)**
```bash
# Install dependencies
npm install socket.io-client node-fetch

# Run the interactive test client
node test-socket-client.js
```

**Available Commands:**
- `bid <amount>` - Place a bid
- `history` - View bid history
- `status` - View current auction status
- `leave` - Leave current auction
- `exit` - Disconnect and quit

**Option B: Using Browser Console**
```javascript
// Load Socket.IO client library
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
document.head.appendChild(script);

// Connect (after script loads)
const socket = io('http://localhost:8000', {
  auth: {
    userId: 'test-user-123',
    userName: 'Test User'
  }
});

// Join an auction
socket.on('connect', () => {
  socket.emit('JOIN_AUCTION', { itemId: 'your-item-id' });
});

// Listen for events
socket.on('AUCTION_STATE', (data) => console.log(data));
socket.on('BID_UPDATE', (data) => console.log(data));
```

---

## 📡 API Endpoints Summary

### REST API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/items` | Get all auction items |
| GET | `/api/items/:id` | Get specific item |
| GET | `/api/items/:id/history` | Get bid history |
| POST | `/api/items` | Create new auction |

### Socket.IO Events

**Client → Server (Emit):**
- `JOIN_AUCTION` - Join auction room
- `PLACE_BID` - Place a bid
- `LEAVE_AUCTION` - Leave auction room
- `GET_BID_HISTORY` - Request bid history

**Server → Client (Listen):**
- `AUCTION_STATE` - Current auction state
- `BID_SUCCESS` - Bid placed successfully
- `BID_ERROR` - Bid failed
- `BID_UPDATE` - New bid broadcast
- `OUTBID_NOTIFICATION` - User outbid notification
- `BID_HISTORY` - Bid history response
- `TIME_WARNING` - Auction ending soon
- `AUCTION_ENDED` - Auction ended

---

## 🔧 Environment Configuration

Key environment variables from `.env`:

```bash
PORT=8000                              # Server port
ALLOWED_ORIGINS=http://localhost:3001  # CORS origins
RATE_LIMIT_WINDOW_MS=60000             # Rate limit window
RATE_LIMIT_MAX_REQUESTS=100            # Max requests per window
MIN_BID_INCREMENT=1.00                 # Minimum bid increment
AUCTION_EXTENSION_SECONDS=30           # Anti-sniping extension
LAST_MINUTE_THRESHOLD_SECONDS=60       # Anti-sniping threshold
LOG_LEVEL=info                         # Logging level
```

See [`env-usage-analysis.md`](./env-usage-analysis.md) for detailed analysis.

---

## 📋 Testing Workflow Example

### Complete End-to-End Test

1. **Get available auctions** (REST)
   ```bash
   curl http://localhost:8000/api/items
   ```

2. **Connect via Socket.IO**
   ```bash
   node test-socket-client.js
   ```

3. **Join an auction** (Socket.IO)
   - Script automatically joins first active auction
   - Or manually: `socket.emit('JOIN_AUCTION', { itemId: 'id' })`

4. **Place a bid** (Socket.IO)
   - Interactive: Type `bid 5001.00`
   - Or: `socket.emit('PLACE_BID', { itemId: 'id', amount: 5001.00 })`

5. **View bid history** (REST or Socket.IO)
   ```bash
   curl http://localhost:8000/api/items/{id}/history
   ```
   Or type `history` in the test client

6. **Create new auction** (REST)
   ```bash
   curl -X POST http://localhost:8000/api/items \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Item",
       "description": "Test description",
       "startingPrice": 100.00,
       "auctionEndTime": "2026-01-30T00:00:00.000Z"
     }'
   ```

---

## 🐛 Common Issues

### Socket.IO Connection Issues

**Problem:** Connection rejected with "Authentication required"

**Solution:** Ensure you're passing auth credentials:
```javascript
io('http://localhost:8000', {
  auth: {
    userId: 'your-user-id',
    userName: 'Your Name'
  }
});
```

### Bid Validation Errors

**Problem:** "Bid must be at least $X.XX"

**Solution:** Your bid must be at least `currentBid + MIN_BID_INCREMENT` ($1.00 by default)

**Problem:** "You are already the highest bidder"

**Solution:** You cannot outbid yourself. Use a different user account.

### Rate Limiting

**Problem:** "Too many requests from this IP"

**Solution:** You've exceeded 100 requests per 60 seconds. Wait and try again.

---

## 📚 Additional Resources

### Source Code
- REST Routes: [`src/routes/auctionRoutes.js`](./src/routes/auctionRoutes.js)
- Socket Handlers: [`src/sockets/socketHandlers.js`](./src/sockets/socketHandlers.js)
- Auction Manager: [`src/services/AuctionManager.js`](./src/services/AuctionManager.js)
- Validation Schemas: [`src/validators/schemas.js`](./src/validators/schemas.js)

### Logs
- All logs: `logs/all.log`
- Error logs: `logs/error.log`

---

## 💡 Tips

1. **Use the test script** for interactive Socket.IO testing - it's the easiest way to test real-time features
2. **Import the Postman collection** for quick REST API testing
3. **Check the logs** (`logs/all.log`) for detailed server activity
4. **Use multiple terminal windows** to simulate multiple users bidding simultaneously
5. **Refer to SOCKET_QUICK_REFERENCE.md** for quick Socket.IO event syntax

---

## 🎯 Next Steps

1. ✅ Start the backend server
2. ✅ Import Postman collection
3. ✅ Run the Socket.IO test client
4. ✅ Test bidding with multiple users
5. ✅ Monitor logs for debugging

Happy Testing! 🚀
