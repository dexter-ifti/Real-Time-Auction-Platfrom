#!/usr/bin/env node

/**
 * Socket.IO Test Client for Live Auction Platform
 * 
 * This script demonstrates how to connect and interact with the auction platform
 * via Socket.IO events.
 * 
 * Usage:
 *   1. Make sure the backend server is running (npm start)
 *   2. Install socket.io-client: npm install socket.io-client
 *   3. Run this script: node test-socket-client.js
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:8000';
const USER_ID = 'test-user-' + Math.random().toString(36).substr(2, 9);
const USER_NAME = 'Test User ' + Math.floor(Math.random() * 1000);

console.log('\n🚀 Starting Socket.IO Test Client...\n');
console.log(`📝 User ID: ${USER_ID}`);
console.log(`👤 User Name: ${USER_NAME}\n`);

// Connect with authentication
const socket = io(SERVER_URL, {
    auth: {
        userId: USER_ID,
        userName: USER_NAME
    }
});

// Track current auction
let currentAuctionId = null;
let currentItem = null;

// ============================================================================
// CONNECTION EVENTS
// ============================================================================

socket.on('connect', () => {
    console.log('✅ Connected to server successfully!');
    console.log(`🔌 Socket ID: ${socket.id}\n`);

    // Fetch available auctions via REST API
    console.log('📡 Fetching available auctions...\n');
    fetchAuctions();
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log(`\n❌ Disconnected from server: ${reason}`);
    if (reason === 'io server disconnect') {
        console.log('Server disconnected the client. Reconnecting...');
        socket.connect();
    }
});

// ============================================================================
// AUCTION EVENTS
// ============================================================================

socket.on('AUCTION_STATE', (data) => {
    console.log('\n📊 AUCTION STATE RECEIVED:');
    console.log('─────────────────────────────────────');
    displayItem(data.item);
    currentItem = data.item;

    // Automatically place a test bid after 2 seconds
    setTimeout(() => {
        if (currentItem && currentItem.status === 'active') {
            const newBid = currentItem.currentBid + 1.00;
            console.log(`\n💰 Attempting to place bid: $${newBid.toFixed(2)}`);

            socket.emit('PLACE_BID', {
                itemId: currentItem.id,
                amount: newBid
            });
        }
    }, 2000);
});

socket.on('BID_SUCCESS', (data) => {
    console.log('\n✅ BID PLACED SUCCESSFULLY!');
    console.log('─────────────────────────────────────');
    console.log(`💵 Amount: $${data.bidRecord.amount.toFixed(2)}`);
    console.log(`🆔 Bid ID: ${data.bidRecord.bidId}`);
    console.log(`⏰ Timestamp: ${data.bidRecord.timestamp}`);
    console.log(`📝 Message: ${data.message}`);

    currentItem = data.item;
});

socket.on('BID_ERROR', (data) => {
    console.log('\n❌ BID FAILED!');
    console.log('─────────────────────────────────────');
    console.log(`🚫 Error Code: ${data.errorCode}`);
    console.log(`📝 Error: ${data.error}`);
    console.log(`🎯 Item ID: ${data.itemId}`);
});

socket.on('BID_UPDATE', (data) => {
    console.log('\n🔄 BID UPDATE (Broadcast):');
    console.log('─────────────────────────────────────');
    console.log(`📦 Item: ${data.item.title}`);
    console.log(`💵 New Bid: $${data.item.currentBid.toFixed(2)}`);
    console.log(`👤 Bidder: ${data.bidder.userName}`);
    console.log(`🔢 Total Bids: ${data.item.bidCount}`);
    console.log(`⏰ Timestamp: ${data.timestamp}`);

    currentItem = data.item;
});

socket.on('OUTBID_NOTIFICATION', (data) => {
    if (data.userId === USER_ID) {
        console.log('\n⚠️  YOU HAVE BEEN OUTBID!');
        console.log('─────────────────────────────────────');
        console.log(`📦 Item: ${data.itemTitle}`);
        console.log(`💵 Your Bid: $${data.previousAmount.toFixed(2)}`);
        console.log(`💰 New Bid: $${data.newAmount.toFixed(2)}`);
        console.log(`👤 New Bidder: ${data.newBidder}`);
    }
});

socket.on('TIME_WARNING', (data) => {
    console.log(`\n⏰ TIME WARNING: ${data.timeRemaining} seconds remaining for item ${data.itemId}`);
});

socket.on('AUCTION_ENDED', (data) => {
    console.log('\n🏁 AUCTION ENDED!');
    console.log('─────────────────────────────────────');
    console.log(`📦 Item: ${data.item.title}`);
    console.log(`💵 Final Bid: $${data.item.currentBid.toFixed(2)}`);
    if (data.winner) {
        console.log(`🏆 Winner: ${data.winner.userName} (${data.winner.userId})`);
        if (data.winner.userId === USER_ID) {
            console.log('🎉 CONGRATULATIONS! YOU WON THE AUCTION! 🎉');
        }
    } else {
        console.log('🏆 Winner: No bids placed');
    }
});

socket.on('BID_HISTORY', (data) => {
    console.log('\n📜 BID HISTORY:');
    console.log('─────────────────────────────────────');
    if (data.history.length === 0) {
        console.log('No bids yet');
    } else {
        data.history.forEach((bid, index) => {
            console.log(`${index + 1}. $${bid.amount.toFixed(2)} - ${bid.userName} - ${new Date(bid.timestamp).toLocaleTimeString()}`);
        });
    }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function displayItem(item) {
    console.log(`📦 Title: ${item.title}`);
    console.log(`📝 Description: ${item.description}`);
    console.log(`💵 Current Bid: $${item.currentBid.toFixed(2)}`);
    console.log(`🔢 Bid Count: ${item.bidCount}`);
    console.log(`📊 Status: ${item.status}`);

    if (item.currentBidder) {
        console.log(`👤 Current Bidder: ${item.currentBidder.userName}`);
    } else {
        console.log(`👤 Current Bidder: None`);
    }

    const endTime = new Date(item.auctionEndTime);
    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));

    console.log(`⏰ Time Remaining: ${formatTime(timeRemaining)}`);
    console.log(`🆔 Item ID: ${item.id}`);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
}

async function fetchAuctions() {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${SERVER_URL}/api/items`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            console.log(`✅ Found ${data.count} auction items\n`);

            // Display all items
            data.data.forEach((item, index) => {
                console.log(`\n${index + 1}. ${item.title}`);
                console.log(`   Current Bid: $${item.currentBid.toFixed(2)}`);
                console.log(`   Status: ${item.status}`);
                console.log(`   ID: ${item.id}`);
            });

            // Join the first active auction
            const activeItem = data.data.find(item => item.status === 'active');
            if (activeItem) {
                currentAuctionId = activeItem.id;
                console.log(`\n🎯 Joining auction: ${activeItem.title}`);

                socket.emit('JOIN_AUCTION', {
                    itemId: currentAuctionId
                });

                // Request bid history after joining
                setTimeout(() => {
                    socket.emit('GET_BID_HISTORY', {
                        itemId: currentAuctionId
                    });
                }, 1000);
            } else {
                console.log('\n⚠️  No active auctions found');
            }
        } else {
            console.log('❌ No auction items available');
        }
    } catch (error) {
        console.error('❌ Error fetching auctions:', error.message);
    }
}

// ============================================================================
// INTERACTIVE COMMANDS
// ============================================================================

console.log('\n📋 Available Commands:');
console.log('  - Type "bid <amount>" to place a bid');
console.log('  - Type "history" to view bid history');
console.log('  - Type "status" to view current auction status');
console.log('  - Type "leave" to leave current auction');
console.log('  - Type "exit" to disconnect and quit\n');

// Handle user input
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

rl.prompt();

rl.on('line', (line) => {
    const input = line.trim().toLowerCase();

    if (input === 'exit') {
        console.log('\n👋 Disconnecting...');
        socket.disconnect();
        process.exit(0);
    } else if (input === 'status') {
        if (currentItem) {
            console.log('\n📊 CURRENT AUCTION STATUS:');
            console.log('─────────────────────────────────────');
            displayItem(currentItem);
        } else {
            console.log('\n⚠️  Not currently in an auction');
        }
    } else if (input === 'history') {
        if (currentAuctionId) {
            socket.emit('GET_BID_HISTORY', {
                itemId: currentAuctionId
            });
        } else {
            console.log('\n⚠️  Not currently in an auction');
        }
    } else if (input === 'leave') {
        if (currentAuctionId) {
            socket.emit('LEAVE_AUCTION', {
                itemId: currentAuctionId
            });
            console.log('\n👋 Left auction');
            currentAuctionId = null;
            currentItem = null;
        } else {
            console.log('\n⚠️  Not currently in an auction');
        }
    } else if (input.startsWith('bid ')) {
        const amount = parseFloat(input.split(' ')[1]);
        if (isNaN(amount)) {
            console.log('\n❌ Invalid amount. Usage: bid <amount>');
        } else if (!currentAuctionId) {
            console.log('\n⚠️  Not currently in an auction');
        } else {
            console.log(`\n💰 Placing bid: $${amount.toFixed(2)}`);
            socket.emit('PLACE_BID', {
                itemId: currentAuctionId,
                amount: amount
            });
        }
    } else if (input) {
        console.log('\n❌ Unknown command. Type "exit" to quit.');
    }

    rl.prompt();
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n\n👋 Disconnecting...');
    socket.disconnect();
    process.exit(0);
});
