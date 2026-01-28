import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(userId, userName) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        userId,
        userName,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupDefaultListeners();
    return this.socket;
  }

  setupDefaultListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
    });
  }

  joinAuction(itemId) {
    if (this.socket) {
      this.socket.emit('JOIN_AUCTION', { itemId });
    }
  }

  leaveAuction(itemId) {
    if (this.socket) {
      this.socket.emit('LEAVE_AUCTION', { itemId });
    }
  }

  placeBid(itemId, amount) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to server'));
        return;
      }

      // Set up one-time listeners for the response
      const successHandler = (data) => {
        this.socket.off('BID_ERROR', errorHandler);
        resolve(data);
      };

      const errorHandler = (data) => {
        this.socket.off('BID_SUCCESS', successHandler);
        reject(new Error(data.error));
      };

      this.socket.once('BID_SUCCESS', successHandler);
      this.socket.once('BID_ERROR', errorHandler);

      // Emit the bid
      this.socket.emit('PLACE_BID', { itemId, amount });
    });
  }

  getBidHistory(itemId) {
    if (this.socket) {
      this.socket.emit('GET_BID_HISTORY', { itemId });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store callback for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  disconnect() {
    if (this.socket) {
      // Clean up all listeners
      this.listeners.forEach((callbacks, event) => {
        this.socket.removeAllListeners(event);
      });
      this.listeners.clear();
      
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default new SocketService();