const Document = require('../models/Document');
const Version = require('../models/Version');

module.exports = (io) => {
  const activeUsers = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-document', async ({ documentId, user }) => {
      socket.join(documentId);

      if (!activeUsers[documentId]) {
        activeUsers[documentId] = [];
      }

      const already = activeUsers[documentId].find(u => u.userId === user._id);
      if (!already) {
        activeUsers[documentId].push({
          userId: user._id,
          name: user.name,
          avatar: user.avatar,
          socketId: socket.id
        });
      }

      io.to(documentId).emit('active-users', activeUsers[documentId]);
      console.log(`${user.name} joined document ${documentId}`);
    });

    socket.on('document-change', ({ documentId, content }) => {
      socket.to(documentId).emit('receive-changes', content);
    });

    socket.on('save-document', async ({ documentId, content, title }) => {
      try {
        await Document.findByIdAndUpdate(documentId, { content, title });
      } catch (error) {
        console.error('Auto save failed:', error.message);
      }
    });

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

    socket.on('disconnect', () => {
      for (const documentId in activeUsers) {
        activeUsers[documentId] = activeUsers[documentId].filter(
          u => u.socketId !== socket.id
        );
        io.to(documentId).emit('active-users', activeUsers[documentId]);
      }
      console.log('User disconnected:', socket.id);
    });
  });
};