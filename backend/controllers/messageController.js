const Message = require('../models/Message');
const User = require('../models/User');

// Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Create and save the message
        const message = new Message({
            sender: senderId,
            recipient: recipientId,
            content: content
        });

        await message.save();

        // Populate sender info for the response
        await message.populate('sender', 'username avatar');
        await message.populate('recipient', 'username');

        // Emit socket event for real-time update
        const io = req.app.get('socketio');
        io.to(recipientId.toString()).emit('newMessage', message);

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: userId },
                { sender: userId, recipient: currentUserId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'username avatar')
        .populate('recipient', 'username');

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages', error: error.message });
    }
};

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get distinct user IDs the current user has messaged with
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { recipient: userId }
                    ]
                }
            },
            {
                $project: {
                    participants: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            { user: '$recipient', lastMessage: '$$ROOT' },
                            { user: '$sender', lastMessage: '$$ROOT' }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$participants.user',
                    lastMessage: { $first: '$participants.lastMessage' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [
                                    { $eq: ['$recipient', userId] },
                                    { $eq: ['$read', false] }
                                ]},
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { 'lastMessage.createdAt': -1 } }
        ]);

        // Populate user details
        const populatedConversations = await Promise.all(
            conversations.map(async (convo) => {
                const user = await User.findById(convo._id).select('username avatar');
                return {
                    user,
                    lastMessage: convo.lastMessage,
                    unreadCount: convo.unreadCount
                };
            })
        );

        res.status(200).json(populatedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const recipientId = req.user._id;

        await Message.updateMany(
            { 
                sender: senderId, 
                recipient: recipientId,
                read: false 
            },
            { $set: { read: true } }
        );

        res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
};
