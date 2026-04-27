const Document = require('../models/Document');
const Version = require('../models/Version');

module.exports = (io) => {
  // Track active users per document
  const activeUsers = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User opens a document
    socket.on('join-document', async ({ documentId, user }) => {
      socket.join(documentId);

      // Add user to active users for this document
      if (!activeUsers[documentId]) {
        activeUsers[documentId] = [];
      }

      // Avoid duplicates
      const already = activeUsers[documentId].find(u => u.userId === user._id);
      if (!already) {
        activeUsers[documentId].push({
          userId: user._id,
          name: user.name,
          avatar: user.avatar,
          socketId: socket.id
        });
      }

      // Tell everyone in the room who is active
      io.to(documentId).emit('active-users', activeUsers[documentId]);

      console.log(`${user.name} joined document ${documentId}`);
    });

    // User is typing — broadcast to others in same document
    socket.on('document-change', ({ documentId, content }) => {
      // Send to everyone EXCEPT the sender
      socket.to(documentId).emit('receive-changes', content);
    });

    // Auto save document to MongoDB
    socket.on('save-document', async ({ documentId, content, title }) => {
      try {
        await Document.findByIdAndUpdate(documentId, { content, title });
      } catch (error) {
        console.error('Auto save failed:', error.message);
      }
    });

    // Save a version snapshot
    socket.on('save-version', async ({ documentId, content, userId }) => {
      try {
        const count = await Version.countDocuments({ document: documentId });
        await Version.create({
          document: documentId,
          content,
          savedBy: userId,
          versionNumber: count + 1
        });
        console.log(`Version ${count + 1} saved for document ${documentId}`);
      } catch (error) {
        console.error('Version save failed:', error.message);
      }
    });

    // User leaves or closes the tab
    socket.on('disconnect', () => {
      // Remove user from all active document rooms
      for (const documentId in activeUsers) {
        activeUsers[documentId] = activeUsers[documentId].filter(
          u => u.socketId !== socket.id
        );
        // Notify remaining users
        io.to(documentId).emit('active-users', activeUsers[documentId]);
      }
      console.log('User disconnected:', socket.id);
    });
  });
};