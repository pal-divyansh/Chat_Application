const { Server } = require('socket.io');

let io;
const onlineUsers = new Map();

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Add user to online users
    socket.on('addUser', (userId) => {
      try {
        if (!userId) {
          throw new Error('Invalid userId');
        }
        onlineUsers.set(userId, socket.id);
        io.emit('getUsers', Array.from(onlineUsers.keys()));
        socket.emit('connectionStatus', { status: 'connected' });
      } catch (error) {
        console.error('Error in addUser:', error);
        socket.emit('error', { message: 'Failed to add user' });
      }
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
      try {
        if (!senderId || !receiverId || !content) {
          throw new Error('Missing required message fields');
        }

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          const messageData = {
            senderId,
            content,
            createdAt: Date.now()
          };
          
          // Send to receiver
          io.to(receiverSocketId).emit('getMessage', messageData);
          
          // Send confirmation to sender
          socket.emit('messageDelivered', {
            messageId: Date.now(),
            status: 'delivered'
          });
        } else {
          // Receiver is offline
          socket.emit('messageDelivered', {
            messageId: Date.now(),
            status: 'pending'
          });
        }
      } catch (error) {
        console.error('Error in sendMessage:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing status
    socket.on('typing', ({ senderId, receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', { senderId, isTyping });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Remove user from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit('getUsers', Array.from(onlineUsers.keys()));
          io.emit('userDisconnected', { userId });
          break;
        }
      }
    });
  });

  // Handle server errors
  io.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });
};

module.exports = { setupSocket };
