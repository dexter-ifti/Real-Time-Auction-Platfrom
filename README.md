# Live Auction Platform

## Prerequisites

- Docker installed

## Step 1: Clone/Download the Project

```bash
git clone https://github.com/dexter-ifti/Real-Time-Auction-Platfrom.git
cd Real-Time-Auction-
```

## Step 2: Start the Project using Docker (Simplest)

```bash
docker compose up --build 
```

You should see:
```
backend-1   |     ========================================
backend-1   |     🚀 Live Auction Platform Server Started
backend-1   |     ========================================
backend-1   |     Environment: development
backend-1   |     Port: 8000
backend-1   |     REST API: http://localhost:8000/api
backend-1   |     WebSocket: ws://localhost:8000
backend-1   |     ========================================
backend-1   |   
frontend-1  | Re-optimizing dependencies because vite config has changed
frontend-1  | 
frontend-1  |   VITE v5.4.21  ready in 518 ms
frontend-1  | 
frontend-1  |   ➜  Local:   http://localhost:3000/
frontend-1  |   ➜  Network: http://172.25.0.3:3000/
```



## Step 3: Open in Browser

Visit: **http://localhost:3000**

You should see:
- 4 sample auction items
- Real-time connection indicator (green)
- Your auto-generated username

## Step 4: Test Concurrent Bidding

1. Open **3 browser windows** (or use incognito mode)
2. Navigate to http://localhost:3000 in each
3. Click "Place Bid" on the same item in all 3 windows
4. Enter the **exact same amount** (e.g., $5001.00)
5. Click "Place Bid" in all windows **simultaneously**

**Expected Result:**
- ✅ Only ONE bid succeeds
- ❌ Other windows show "Bid too low" error
- ✅ All windows update with the new price
- ✅ This proves race condition prevention is working!

## What's Running?

### Backend (Port 8000)
- REST API: http://localhost:8000/api/items
- WebSocket: ws://localhost:8000
- Health Check: http://localhost:8000/api/health

### Frontend (Port 3000)
- Web App: http://localhost:3000



## Environment Configuration

### Backend (.env)

```env
PORT=8000
MIN_BID_INCREMENT=1.00
AUCTION_EXTENSION_SECONDS=30
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```



## API Testing

### Using cURL

```bash
# Get all items
curl http://localhost:3000/api/items

# Get specific item
curl http://localhost:3000/api/items/{item-id}

# Health check
curl http://localhost:3000/api/health
```

### Using Postman

Import these endpoints:
- GET `http://localhost:3000/api/items`
- GET `http://localhost:3000/api/items/:id`
- GET `http://localhost:3000/api/items/:id/history`
- POST `http://localhost:3000/api/items`

## Stopping the Servers

In each terminal, simply run: **docker compose down**

