const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { User, Chat, Message } = require('../models');

// @route   GET /api/chats
// @desc    Get all chats for the authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.findAll({
      where: {
        $or: [
          { user1Id: req.user.id },
          { user2Id: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: Message,
          as: 'lastMessage',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    // Format response to show other user info instead of both users
    const formattedChats = chats.map(chat => {
      const otherUser = chat.user1Id === req.user.id ? chat.user2 : chat.user1;
      return {
        id: chat.id,
        user: otherUser,
        unreadCount: chat.user1Id === req.user.id ? chat.user1UnreadCount : chat.user2UnreadCount,
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt,
        createdAt: chat.createdAt
      };
    });
    
    res.json(formattedChats);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats
// @desc    Create a new chat or get existing chat with a user
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }
    
    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Prevent chat with self
    if (receiverId === req.user.id) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }
    
    // Check if chat already exists
    let chat = await Chat.findOne({
      where: {
        $or: [
          { user1Id: req.user.id, user2Id: receiverId },
          { user1Id: receiverId, user2Id: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });
    
    // If chat exists, return it
    if (chat) {
      const otherUser = chat.user1Id === req.user.id ? chat.user2 : chat.user1;
      return res.json({
        id: chat.id,
        user: otherUser,
        unreadCount: chat.user1Id === req.user.id ? chat.user1UnreadCount : chat.user2UnreadCount,
        updatedAt: chat.updatedAt,
        createdAt: chat.createdAt
      });
    }
    
    // Create new chat
    chat = await Chat.create({
      user1Id: req.user.id,
      user2Id: receiverId,
      user1UnreadCount: 0,
      user2UnreadCount: 0
    });
    
    // Get chat with user info
    chat = await Chat.findByPk(chat.id, {
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });
    
    const otherUser = chat.user1Id === req.user.id ? chat.user2 : chat.user1;
    
    res.status(201).json({
      id: chat.id,
      user: otherUser,
      unreadCount: 0,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chats/:id
// @desc    Get chat by ID with messages
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'name', 'avatar']
        }
      ]
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant in the chat
    if (chat.user1Id !== req.user.id && chat.user2Id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }
    
    // Get messages for the chat
    const messages = await Message.findAll({
      where: { chatId: chat.id },
      order: [['createdAt', 'ASC']]
    });
    
    // Reset unread count for the user
    if (chat.user1Id === req.user.id && chat.user1UnreadCount > 0) {
      chat.user1UnreadCount = 0;
      await chat.save();
    } else if (chat.user2Id === req.user.id && chat.user2UnreadCount > 0) {
      chat.user2UnreadCount = 0;
      await chat.save();
    }
    
    const otherUser = chat.user1Id === req.user.id ? chat.user2 : chat.user1;
    
    res.json({
      id: chat.id,
      user: otherUser,
      messages,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats/:id/messages
// @desc    Send a message to a chat
// @access  Private
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant in the chat
    if (chat.user1Id !== req.user.id && chat.user2Id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to send messages to this chat' });
    }
    
    const { content, attachmentUrl } = req.body;
    
    if (!content && !attachmentUrl) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }
    
    // Create message
    const message = await Message.create({
      chatId: chat.id,
      senderId: req.user.id,
      content,
      attachmentUrl,
      read: false
    });
    
    // Update unread count for the other user
    if (chat.user1Id === req.user.id) {
      chat.user2UnreadCount += 1;
    } else {
      chat.user1UnreadCount += 1;
    }
    
    // Update chat's updatedAt
    chat.changed('updatedAt', true);
    await chat.save();
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chats/:id/read
// @desc    Mark all messages in a chat as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant in the chat
    if (chat.user1Id !== req.user.id && chat.user2Id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }
    
    // Reset unread count for the user
    if (chat.user1Id === req.user.id) {
      chat.user1UnreadCount = 0;
    } else {
      chat.user2UnreadCount = 0;
    }
    
    await chat.save();
    
    // Mark all messages from other user as read
    await Message.update(
      { read: true },
      {
        where: {
          chatId: chat.id,
          senderId: chat.user1Id === req.user.id ? chat.user2Id : chat.user1Id,
          read: false
        }
      }
    );
    
    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chats/:id
// @desc    Delete a chat and all its messages
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findByPk(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is a participant in the chat
    if (chat.user1Id !== req.user.id && chat.user2Id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }
    
    // Delete all messages in the chat
    await Message.destroy({
      where: { chatId: chat.id }
    });
    
    // Delete the chat
    await chat.destroy();
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
