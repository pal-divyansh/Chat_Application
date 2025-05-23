const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    },
    delivered: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add indexes for better query performance
MessageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
MessageSchema.index({ receiver: 1, read: 1 });

// Virtual for message URL
MessageSchema.virtual('url').get(function() {
  return `/api/messages/${this._id}`;
});

// Static method to get conversation between two users
MessageSchema.statics.getConversation = async function(user1Id, user2Id, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return await this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'username avatar')
  .populate('receiver', 'username avatar')
  .lean();
};

// Method to mark message as read
MessageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    await this.save();
  }
  return this;
};

// Method to mark message as delivered
MessageSchema.methods.markAsDelivered = async function() {
  if (!this.delivered) {
    this.delivered = true;
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('Message', MessageSchema);