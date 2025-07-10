const { User, Chat, Message } = require('../models');

/**
 * Socket.IO handler for real-time chat functionality
 * @param {Object} io - Socket.IO server instance
 */
module.exports = function(io) {
  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Handle user login (store socket id)
    socket.on('login', async (userId) => {
      try {
        // Add user to online users map
        onlineUsers.set(userId, socket.id);
        
        // Get user data
        const user = await User.findByPk(userId, {
          attributes: ['id', 'name', 'avatar']
        });
        
        if (user) {
          // Broadcast user online status
          socket.broadcast.emit('user_online', {
            userId: user.id,
            name: user.name
          });
          
          console.log(`User ${user.name} (${userId}) logged in`);
        }
        
        // Send online users to the newly connected user
        const onlineUserIds = [...onlineUsers.keys()];
        socket.emit('online_users', onlineUserIds);
      } catch (error) {
        console.error('Socket login error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Find and remove the disconnected user
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          // Broadcast user offline status
          io.emit('user_offline', userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      console.log('Client disconnected:', socket.id);
    });

    // Handle joining chat room
    socket.on('join_chat', async (chatId) => {
      try {
        // Leave all previous rooms
        Array.from(socket.rooms).forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });
        
        // Join the new chat room
        socket.join(`chat_${chatId}`);
        console.log(`Socket ${socket.id} joined chat_${chatId}`);
        
        // Mark messages as read when joining chat
        socket.on('mark_read', async ({ chatId, userId }) => {
          try {
            await Message.update(
              { read: true },
              { 
                where: { 
                  chatId: chatId,
                  userId: { $ne: userId },
                  read: false
                }
              }
            );
            
            // Emit messages read event to all users in chat
            io.to(`chat_${chatId}`).emit('messages_read', { chatId, userId });
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        });
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });

    // Handle new message
    socket.on('send_message', async (messageData) => {
      try {
        const { chatId, senderId, content, attachment } = messageData;
        
        // Create message in database
        const newMessage = await Message.create({
          chatId,
          userId: senderId,
          content,
          attachment,
          read: false
        });
        
        // Get message with user info
        const messageWithUser = await Message.findByPk(newMessage.id, {
          include: {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }
        });
        
        // Update chat's lastMessage and timestamp
        await Chat.update(
          { lastMessage: content, updatedAt: new Date() },
          { where: { id: chatId } }
        );
        
        // Send to all users in the chat room
        io.to(`chat_${chatId}`).emit('new_message', messageWithUser);
        
        // Get chat to find participants
        const chat = await Chat.findByPk(chatId, {
          include: [
            {
              model: User,
              as: 'participants',
              attributes: ['id']
            }
          ]
        });
        
        // Send notification to offline participants
        if (chat && chat.participants) {
          chat.participants.forEach(participant => {
            // Don't send notification to the sender
            if (participant.id !== senderId) {
              const socketId = onlineUsers.get(participant.id.toString());
              
              // If user is online but not in this chat room
              if (socketId) {
                const participantSocket = io.sockets.sockets.get(socketId);
                if (participantSocket && !participantSocket.rooms.has(`chat_${chatId}`)) {
                  io.to(socketId).emit('chat_notification', {
                    chatId,
                    message: messageWithUser,
                    sender: messageWithUser.user
                  });
                }
              }
            }
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ chatId, userId, isTyping }) => {
      // Broadcast to everyone in the room except the sender
      socket.to(`chat_${chatId}`).emit('user_typing', { userId, isTyping });
    });
  });

  return io;
};
