const Message = require('../models/Message');
const User = require('../models/User');

const setupMessageHandlers = (io, socket) => {
  console.log('Setting up message handlers for socket:', socket.id);
  
  // Handle private messages
  socket.on('private-message', async ({ senderId, recipientId, content, type = 'text', postId }) => {
    console.log('Received private message:', { senderId, recipientId, content, type, postId });
    
    try {
      // Validate sender exists
      const sender = await User.findById(senderId);
      if (!sender) {
        console.error('Sender not found:', senderId);
        socket.emit('message-error', { error: 'Sender not found' });
        return;
      }

      // Validate recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        console.error('Recipient not found:', recipientId);
        socket.emit('message-error', { error: 'Recipient not found' });
        return;
      }

      // Create and save message
      const message = new Message({
        sender: senderId,
        recipient: recipientId,
        content,
        type,
        postId,
        read: false,
      });
      
      console.log('Saving message to database...');
      const savedMessage = await message.save();
      console.log('Message saved successfully:', savedMessage._id);

      // Populate sender and recipient with full details
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'name email profilePicture avatar')
        .populate('recipient', 'name email profilePicture avatar')
        .lean()
        .exec();

      console.log('Populated message ready to send:', populatedMessage);

      // Send message to recipient if online
      io.to(recipientId).emit('new-message', populatedMessage);
      // Also send back to sender (confirmation)
      io.to(senderId).emit('new-message', populatedMessage);
      
      console.log('Message emitted to both sender and recipient');
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('message-error', { error: 'Failed to send message', details: error.message });
    }
  });

  // Handle marking messages as read
  socket.on('mark-messages-read', async ({ userId, senderId }) => {
    try {
      await Message.updateMany(
        {
          recipient: userId,
          sender: senderId,
          read: false
        },
        {
          read: true
        }
      );

      // Notify sender that messages have been read
      io.to(senderId).emit('messages-marked-read', { by: userId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle post sharing
  socket.on('share-post', async ({ senderId, recipientId, postId, message }) => {
    try {
      const messageDoc = new Message({
        sender: senderId,
        recipient: recipientId,
        content: message || '',
        type: 'post',
        postId,
        read: false,
      });
      await messageDoc.save();

      // Populate sender and recipient
      const populatedMessage = await messageDoc.populate(['sender', 'recipient']);

      // Send message to recipient if online
      io.to(recipientId).emit('new-message', populatedMessage);
      // Also send back to sender
      io.to(senderId).emit('new-message', populatedMessage);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  });
};

module.exports = setupMessageHandlers;