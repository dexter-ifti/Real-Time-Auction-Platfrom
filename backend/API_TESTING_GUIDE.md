# API Testing Guide - Live Auction Platform

This guide provides complete documentation for testing both REST API endpoints and Socket.IO events.

---

## Table of Contents
1. [REST API Endpoints](#rest-api-endpoints)
2. [Socket.IO Events](#socketio-events)
3. [Testing Socket.IO with Postman](#testing-socketio-with-postman)
4. [Testing Socket.IO with Other Tools](#testing-socketio-with-other-tools)

---

## REST API Endpoints

### Base URL
```
http://localhost:8000
```

### 1. Health Check
**Endpoint:** `GET /api/health`

**Description:** Check if the server is running

**Request:**
```http
GET http://localhost:8000/api/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-29T02:28:56.000Z",
  "uptime": 123.456
}
```

---

### 2. Get All Auction Items
**Endpoint:** `GET /api/items`

**Description:** Retrieve all auction items

**Request:**
```http
GET http://localhost:8000/api/items
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "uuid-here",
      "title": "Vintage Rolex Submariner 1960s",
      "description": "Rare vintage Rolex watch in excellent condition",
      "startingPrice": 5000.00,
      "currentBid": 5000.00,
      "imageUrl": "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
      "category": "Watches",
      "auctionEndTime": "2026-01-29T02:33:56.000Z",
      "currentBidder": null,
      "bidCount": 0,
      "status": "active",
      "createdAt": "2026-01-29T02:28:56.000Z",
      "previousBidders": []
    }
  ]
}
```

---

### 3. Get Specific Auction Item
**Endpoint:** `GET /api/items/:id`

**Description:** Retrieve a single auction item by ID

**Request:**
```http
GET http://localhost:8000/api/items/{{itemId}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "title": "Vintage Rolex Submariner 1960s",
    "description": "Rare vintage Rolex watch in excellent condition",
    "startingPrice": 5000.00,
    "currentBid": 5250.00,
    "currentBidder": {
      "userId": "user123",
      "userName": "John Doe",
      "bidTime": "2026-01-29T02:30:00.000Z"
    },
    "bidCount": 3,
    "status": "active"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Item not found"
}
```

---

### 4. Get Bid History
**Endpoint:** `GET /api/items/:id/history`

**Description:** Get all bids placed on a specific item

**Request:**
```http
GET http://localhost:8000/api/items/{{itemId}}/history
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "bidId": "bid-uuid-1",
      "amount": 5100.00,
      "userId": "user123",
      "userName": "John Doe",
      "timestamp": "2026-01-29T02:29:00.000Z"
    },
    {
      "bidId": "bid-uuid-2",
      "amount": 5200.00,
      "userId": "user456",
      "userName": "Jane Smith",
      "timestamp": "2026-01-29T02:29:30.000Z"
    },
    {
      "bidId": "bid-uuid-3",
      "amount": 5250.00,
      "userId": "user123",
      "userName": "John Doe",
      "timestamp": "2026-01-29T02:30:00.000Z"
    }
  ]
}
```

---

### 5. Create New Auction Item
**Endpoint:** `POST /api/items`

**Description:** Create a new auction item (admin functionality)

**Request:**
```http
POST http://localhost:8000/api/items
Content-Type: application/json

{
  "title": "iPhone 15 Pro Max 256GB",
  "description": "Brand new sealed iPhone 15 Pro Max in Natural Titanium",
  "startingPrice": 1000.00,
  "imageUrl": "https://images.unsplash.com/photo-1234567890",
  "category": "Electronics",
  "auctionEndTime": "2026-01-29T03:00:00.000Z"
}
```

**Validation Rules:**
- `title`: 3-200 characters, required
- `description`: max 1000 characters, required
- `startingPrice`: positive number with 2 decimal places, required
- `imageUrl`: valid URI, optional
- `category`: max 50 characters, optional
- `auctionEndTime`: ISO date in the future, required

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "title": "iPhone 15 Pro Max 256GB",
    "description": "Brand new sealed iPhone 15 Pro Max in Natural Titanium",
    "startingPrice": 1000.00,
    "currentBid": 1000.00,
    "imageUrl": "https://images.unsplash.com/photo-1234567890",
    "category": "Electronics",
    "auctionEndTime": "2026-01-29T03:00:00.000Z",
    "currentBidder": null,
    "bidCount": 0,
    "status": "active",
    "createdAt": "2026-01-29T02:28:56.000Z",
    "previousBidders": []
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "\"title\" length must be at least 3 characters long"
}
```

---

## Socket.IO Events

### Connection Setup

**Server URL:** `ws://localhost:8000`

**Authentication Required:**
All socket connections require authentication via handshake:

```javascript
const socket = io('http://localhost:8000', {
  auth: {
    userId: 'user123',
    userName: 'John Doe'
  }
});
```

> ⚠️ **Important:** Without `userId` and `userName` in auth, connection will be rejected with error: "Authentication required"

---

### Client → Server Events (Emit)

#### 1. JOIN_AUCTION
**Description:** Join an auction room to receive real-time updates

**Emit:**
```json
{
  "itemId": "uuid-of-auction-item"
}
```

**Receives Back:** `AUCTION_STATE` event with current item data

**Example:**
```javascript
socket.emit('JOIN_AUCTION', {
  itemId: '123e4567-e89b-12d3-a456-426614174000'
});
```

---

#### 2. PLACE_BID
**Description:** Place a bid on an auction item

**Emit:**
```json
{
  "itemId": "uuid-of-auction-item",
  "amount": 5250.00
}
```

**Validation:**
- `itemId`: required string
- `amount`: required positive number with 2 decimal places
- Must be at least `currentBid + MIN_BID_INCREMENT` (default: $1.00)
- Cannot bid on your own current bid

**Success Response:** `BID_SUCCESS` event
**Error Response:** `BID_ERROR` event

**Example:**
```javascript
socket.emit('PLACE_BID', {
  itemId: '123e4567-e89b-12d3-a456-426614174000',
  amount: 5250.00
});
```

---

#### 3. LEAVE_AUCTION
**Description:** Leave an auction room

**Emit:**
```json
{
  "itemId": "uuid-of-auction-item"
}
```

**Example:**
```javascript
socket.emit('LEAVE_AUCTION', {
  itemId: '123e4567-e89b-12d3-a456-426614174000'
});
```

---

#### 4. GET_BID_HISTORY
**Description:** Request bid history for an item

**Emit:**
```json
{
  "itemId": "uuid-of-auction-item"
}
```

**Receives Back:** `BID_HISTORY` event

**Example:**
```javascript
socket.emit('GET_BID_HISTORY', {
  itemId: '123e4567-e89b-12d3-a456-426614174000'
});
```

---

### Server → Client Events (Listen)

#### 1. AUCTION_STATE
**Description:** Sent when joining an auction, contains current item state

**Payload:**
```json
{
  "item": {
    "id": "uuid",
    "title": "Vintage Rolex Submariner 1960s",
    "currentBid": 5250.00,
    "currentBidder": {
      "userId": "user123",
      "userName": "John Doe",
      "bidTime": "2026-01-29T02:30:00.000Z"
    },
    "bidCount": 3,
    "status": "active",
    "auctionEndTime": "2026-01-29T02:33:56.000Z"
  }
}
```

---

#### 2. BID_SUCCESS
**Description:** Confirmation that your bid was placed successfully

**Payload:**
```json
{
  "item": {
    "id": "uuid",
    "title": "Vintage Rolex Submariner 1960s",
    "currentBid": 5250.00,
    "currentBidder": {
      "userId": "user123",
      "userName": "John Doe",
      "bidTime": "2026-01-29T02:30:00.000Z"
    }
  },
  "bidRecord": {
    "bidId": "bid-uuid",
    "amount": 5250.00,
    "userId": "user123",
    "userName": "John Doe",
    "timestamp": "2026-01-29T02:30:00.000Z"
  },
  "message": "Your bid has been placed successfully!"
}
```

---

#### 3. BID_ERROR
**Description:** Bid placement failed

**Payload:**
```json
{
  "error": "Bid must be at least $5251.00. Current bid is $5250.00",
  "errorCode": "BID_TOO_LOW",
  "itemId": "uuid"
}
```

**Error Codes:**
- `BID_TOO_LOW` - Bid amount is below minimum required
- `SELF_OUTBID` - User is already the highest bidder
- `AUCTION_ENDED` - Auction has already ended
- `BID_FAILED` - General bid failure

---

#### 4. BID_UPDATE
**Description:** Broadcast to all users in auction room when a new bid is placed

**Payload:**
```json
{
  "item": {
    "id": "uuid",
    "title": "Vintage Rolex Submariner 1960s",
    "currentBid": 5250.00,
    "currentBidder": {
      "userId": "user123",
      "userName": "John Doe"
    },
    "bidCount": 4
  },
  "bidder": {
    "userId": "user123",
    "userName": "John Doe"
  },
  "timestamp": "2026-01-29T02:30:00.000Z"
}
```

---

#### 5. OUTBID_NOTIFICATION
**Description:** Notification sent when a user has been outbid

**Payload:**
```json
{
  "itemId": "uuid",
  "itemTitle": "Vintage Rolex Submariner 1960s",
  "previousAmount": 5250.00,
  "newAmount": 5300.00,
  "newBidder": "Jane Smith",
  "userId": "user123"
}
```

---

#### 6. BID_HISTORY
**Description:** Response to GET_BID_HISTORY request

**Payload:**
```json
{
  "itemId": "uuid",
  "history": [
    {
      "bidId": "bid-uuid-1",
      "amount": 5100.00,
      "userId": "user123",
      "userName": "John Doe",
      "timestamp": "2026-01-29T02:29:00.000Z"
    },
    {
      "bidId": "bid-uuid-2",
      "amount": 5200.00,
      "userId": "user456",
      "userName": "Jane Smith",
      "timestamp": "2026-01-29T02:29:30.000Z"
    }
  ]
}
```

---

#### 7. TIME_WARNING
**Description:** Sent every 5 seconds when auction has less than 60 seconds remaining

**Payload:**
```json
{
  "itemId": "uuid",
  "timeRemaining": 45
}
```

---

#### 8. AUCTION_ENDED
**Description:** Broadcast when an auction ends

**Payload:**
```json
{
  "item": {
    "id": "uuid",
    "title": "Vintage Rolex Submariner 1960s",
    "currentBid": 5300.00,
    "status": "ended"
  },
  "winner": {
    "userId": "user456",
    "userName": "Jane Smith",
    "bidTime": "2026-01-29T02:32:00.000Z"
  }
}
```

---

## Testing Socket.IO with Postman

### Step 1: Create New WebSocket Request
1. Open Postman
2. Click **New** → **WebSocket Request**
3. Enter URL: `ws://localhost:8000`

### Step 2: Add Authentication
Before connecting, you need to add authentication parameters. Unfortunately, Postman's WebSocket doesn't support Socket.IO's auth handshake directly.

**Workaround:** Use Socket.IO client library in a Node.js script or use dedicated tools.

---

## Testing Socket.IO with Other Tools

### Option 1: Socket.IO Client Tool (Browser Extension)
**Recommended:** [Socket.IO Client Tool](https://chrome.google.com/webstore/detail/socketio-client-tool)

1. Install the extension
2. Open the tool
3. Enter server URL: `http://localhost:8000`
4. Add authentication:
   ```json
   {
     "auth": {
       "userId": "test-user-123",
       "userName": "Test User"
     }
   }
   ```
5. Connect and start emitting events

---

### Option 2: Node.js Test Script

Create a file `test-socket.js`:

```javascript
const io = require('socket.io-client');

// Connect with authentication
const socket = io('http://localhost:8000', {
  auth: {
    userId: 'test-user-123',
    userName: 'Test User'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Join an auction (replace with actual item ID from GET /api/items)
  socket.emit('JOIN_AUCTION', {
    itemId: 'YOUR_ITEM_ID_HERE'
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Listen for auction state
socket.on('AUCTION_STATE', (data) => {
  console.log('📊 Auction State:', data);
  
  // Place a bid
  const newBid = data.item.currentBid + 1.00;
  console.log(`💰 Placing bid: $${newBid}`);
  
  socket.emit('PLACE_BID', {
    itemId: data.item.id,
    amount: newBid
  });
});

// Listen for bid success
socket.on('BID_SUCCESS', (data) => {
  console.log('✅ Bid placed successfully!', data);
});

// Listen for bid errors
socket.on('BID_ERROR', (data) => {
  console.error('❌ Bid error:', data);
});

// Listen for bid updates
socket.on('BID_UPDATE', (data) => {
  console.log('🔄 Bid update:', data);
});

// Listen for outbid notifications
socket.on('OUTBID_NOTIFICATION', (data) => {
  console.log('⚠️ You have been outbid!', data);
});

// Listen for time warnings
socket.on('TIME_WARNING', (data) => {
  console.log('⏰ Time warning:', data);
});

// Listen for auction ended
socket.on('AUCTION_ENDED', (data) => {
  console.log('🏁 Auction ended:', data);
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});
```

**Run the script:**
```bash
npm install socket.io-client
node test-socket.js
```

---

### Option 3: Insomnia (with Plugin)

Insomnia doesn't natively support Socket.IO, but you can:
1. Use REST API endpoints to get item IDs
2. Use the Node.js script above for Socket.IO testing
3. Or use Insomnia for REST API only

---

## Testing Workflow Example

### Complete Test Scenario

1. **Get all items** (REST API)
   ```
   GET http://localhost:8000/api/items
   ```
   Copy an `itemId` from the response

2. **Connect via Socket.IO** with auth credentials

3. **Join auction** (Socket.IO)
   ```json
   Event: JOIN_AUCTION
   Data: { "itemId": "copied-item-id" }
   ```

4. **Place a bid** (Socket.IO)
   ```json
   Event: PLACE_BID
   Data: { 
     "itemId": "copied-item-id",
     "amount": 5001.00
   }
   ```

5. **Get bid history** (REST API)
   ```
   GET http://localhost:8000/api/items/copied-item-id/history
   ```

6. **Leave auction** (Socket.IO)
   ```json
   Event: LEAVE_AUCTION
   Data: { "itemId": "copied-item-id" }
   ```

---

## Environment Variables Reference

From `.env` file:
```bash
PORT=8000
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173,http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MIN_BID_INCREMENT=1.00
AUCTION_EXTENSION_SECONDS=30
LAST_MINUTE_THRESHOLD_SECONDS=60
LOG_LEVEL=info
```

---

## Rate Limiting

REST API endpoints are rate-limited:
- **Window:** 60 seconds (60,000ms)
- **Max Requests:** 100 per window
- **Response when exceeded:**
  ```json
  {
    "message": "Too many requests from this IP, please try again later"
  }
  ```

---

## Common Issues & Solutions

### Issue: Socket connection rejected
**Solution:** Ensure you're passing `userId` and `userName` in the auth object during connection

### Issue: "Bid must be at least $X.XX"
**Solution:** Check current bid and add at least `MIN_BID_INCREMENT` ($1.00 by default)

### Issue: "You are already the highest bidder"
**Solution:** You cannot outbid yourself. Use a different user account

### Issue: "Auction has ended"
**Solution:** The auction time has expired. Create a new auction or use a different item

---

## Additional Resources

- **Source Code:**
  - REST Routes: [`src/routes/auctionRoutes.js`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/routes/auctionRoutes.js)
  - Socket Handlers: [`src/sockets/socketHandlers.js`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/sockets/socketHandlers.js)
  - Validation Schemas: [`src/validators/schemas.js`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/validators/schemas.js)

- **Logs:** Check `logs/all.log` and `logs/error.log` for detailed server logs
