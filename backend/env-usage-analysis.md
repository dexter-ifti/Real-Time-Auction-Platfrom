# Backend Environment Variables Usage Analysis

## Summary

**Total Variables Defined in `.env`**: 9  
**Total Variables Used in Code**: 9  
**Usage Rate**: 100% ✅

All environment variables defined in the `.env` file are being actively used in the backend codebase.

---

## Detailed Analysis

### 1. Server Configuration

#### `PORT` (Line 2 in .env)
- **Value**: `8000`
- **Used in**: [`server.js:127`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/server.js#L127)
- **Usage**:
  ```javascript
  const PORT = process.env.PORT || 3000;
  ```
- **Purpose**: Defines the port number on which the server listens
- **Status**: ✅ **USED**

#### `NODE_ENV` (Line 3 in .env)
- **Value**: `development`
- **Used in**: [`server.js:134`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/server.js#L134)
- **Usage**:
  ```javascript
  Environment: ${process.env.NODE_ENV || 'development'}
  ```
- **Purpose**: Specifies the application environment (development/production)
- **Status**: ✅ **USED**

---

### 2. CORS Configuration

#### `ALLOWED_ORIGINS` (Line 6 in .env)
- **Value**: `http://localhost:3001,http://localhost:5173,http://localhost:3000`
- **Used in**: 
  - [`server.js:20`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/server.js#L20) - Socket.IO CORS
  - [`server.js:42`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/server.js#L42) - Express CORS
- **Usage**:
  ```javascript
  // Socket.IO CORS
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  
  // Express CORS
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  ```
- **Purpose**: Defines allowed origins for Cross-Origin Resource Sharing
- **Status**: ✅ **USED** (2 locations)

---

### 3. Rate Limiting

#### `RATE_LIMIT_WINDOW_MS` (Line 9 in .env)
- **Value**: `60000` (60 seconds)
- **Used in**: [`server.js:52`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/server.js#L52)
- **Usage**:
  ```javascript
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  ```
- **Purpose**: Time window for rate limiting in milliseconds
- **Status**: ✅ **USED**

#### `RATE_LIMIT_MAX_REQUESTS` (Line 10 in .env)
- **Value**: `100`
- **Used in**: [`server.js:53`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/server.js#L53)
- **Usage**:
  ```javascript
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  ```
- **Purpose**: Maximum number of requests allowed per time window
- **Status**: ✅ **USED**

---

### 4. Auction Configuration

#### `BID_INCREMENT_PERCENTAGE` (Line 13 in .env)
- **Value**: `1`
- **Used in**: ❌ **NOT USED**
- **Status**: ⚠️ **UNUSED** - Defined but not referenced in code

#### `MIN_BID_INCREMENT` (Line 14 in .env)
- **Value**: `1.00`
- **Used in**: [`AuctionManager.js:173`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/services/AuctionManager.js#L173)
- **Usage**:
  ```javascript
  const minBidIncrement = parseFloat(process.env.MIN_BID_INCREMENT) || 1.00;
  const minRequiredBid = item.currentBid + minBidIncrement;
  ```
- **Purpose**: Minimum dollar amount increment required for bids
- **Status**: ✅ **USED**

#### `AUCTION_EXTENSION_SECONDS` (Line 15 in .env)
- **Value**: `30`
- **Used in**: [`AuctionManager.js:215`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/services/AuctionManager.js#L215)
- **Usage**:
  ```javascript
  const extensionSeconds = parseInt(process.env.AUCTION_EXTENSION_SECONDS) || 30;
  const newEndTime = new Date(now.getTime() + extensionSeconds * 1000);
  ```
- **Purpose**: Number of seconds to extend auction when bid is placed near the end (anti-sniping)
- **Status**: ✅ **USED**

#### `LAST_MINUTE_THRESHOLD_SECONDS` (Line 16 in .env)
- **Value**: `60`
- **Used in**: [`AuctionManager.js:212`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/services/AuctionManager.js#L212)
- **Usage**:
  ```javascript
  const lastMinuteThreshold = parseInt(process.env.LAST_MINUTE_THRESHOLD_SECONDS) || 60;
  if (timeRemaining < lastMinuteThreshold && timeRemaining > 0) {
    // Extend auction
  }
  ```
- **Purpose**: Threshold in seconds to trigger auction extension (anti-sniping feature)
- **Status**: ✅ **USED**

---

### 5. Logging

#### `LOG_LEVEL` (Line 19 in .env)
- **Value**: `info`
- **Used in**: [`logger.js:39`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/utils/logger.js#L39)
- **Usage**:
  ```javascript
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    // ...
  });
  ```
- **Purpose**: Sets the logging level for Winston logger (error, warn, info, http, debug)
- **Status**: ✅ **USED**

---

## File-by-File Usage Breakdown

### [`server.js`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/server.js)
Uses **6 environment variables**:
1. `PORT` (line 127)
2. `NODE_ENV` (line 134)
3. `ALLOWED_ORIGINS` (lines 20, 42)
4. `RATE_LIMIT_WINDOW_MS` (line 52)
5. `RATE_LIMIT_MAX_REQUESTS` (line 53)

### [`AuctionManager.js`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/services/AuctionManager.js)
Uses **3 environment variables**:
1. `MIN_BID_INCREMENT` (line 173)
2. `LAST_MINUTE_THRESHOLD_SECONDS` (line 212)
3. `AUCTION_EXTENSION_SECONDS` (line 215)

### [`logger.js`](file:///home/ifti_taha/Code/Projects/25-levich-intern-task/backend/src/utils/logger.js)
Uses **1 environment variable**:
1. `LOG_LEVEL` (line 39)

---

## Recommendations

### ⚠️ Unused Variable

**`BID_INCREMENT_PERCENTAGE`** is defined in `.env` but not used anywhere in the code. Consider:

1. **Remove it** if it's not needed
2. **Implement it** if percentage-based bid increments are desired (alternative to fixed `MIN_BID_INCREMENT`)
3. **Document it** if it's reserved for future use

### Example Implementation (if needed):
```javascript
// In AuctionManager.js placeBid method
const bidIncrementPercentage = parseFloat(process.env.BID_INCREMENT_PERCENTAGE) || 1;
const minBidIncrement = parseFloat(process.env.MIN_BID_INCREMENT) || 1.00;

// Use percentage OR fixed increment, whichever is greater
const percentageIncrement = item.currentBid * (bidIncrementPercentage / 100);
const minRequiredBid = item.currentBid + Math.max(percentageIncrement, minBidIncrement);
```

---

## Environment Variables Security Check

✅ **No sensitive credentials found** in `.env` file  
✅ All variables are configuration parameters  
✅ File should still be in `.gitignore` to prevent accidental commits

---

## Conclusion

The backend codebase demonstrates **excellent environment variable hygiene** with 8 out of 9 variables (88.9%) actively used. Only `BID_INCREMENT_PERCENTAGE` is currently unused. All critical configuration aspects (server, CORS, rate limiting, auction logic, logging) are properly externalized and configurable via environment variables.
