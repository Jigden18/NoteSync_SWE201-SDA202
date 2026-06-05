module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_note', (noteId) => {
      socket.join(`note:${noteId}`);
      io.to(`note:${noteId}`).emit(
        'viewer_count',
        io.sockets.adapter.rooms.get(`note:${noteId}`)?.size ?? 0
      );
    });

    socket.on('leave_note', (noteId) => {
      socket.leave(`note:${noteId}`);
      io.to(`note:${noteId}`).emit(
        'viewer_count',
        io.sockets.adapter.rooms.get(`note:${noteId}`)?.size ?? 0
      );
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          io.to(room).emit(
            'viewer_count',
            (io.sockets.adapter.rooms.get(room)?.size ?? 1) - 1
          );
        }
      }
    });
  });
};
