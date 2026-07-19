export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('investigation:join', ({ investigationId }) => {
      if (investigationId) socket.join(investigationId);
    });

    socket.on('investigation:leave', ({ investigationId }) => {
      if (investigationId) socket.leave(investigationId);
    });
  });
}
