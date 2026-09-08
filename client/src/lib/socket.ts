import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.io client instance connected to the /retro namespace.
 */
export const getRetroSocket = (): Socket => {
  if (!socket) {
    const rawUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:5000';

    const serverOrigin = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

    socket = io(`${serverOrigin}/retro`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    if (process.env.NODE_ENV !== 'production') {
      socket.on('connect', () => {
        console.log(
          `%c⚡ [Socket.io] Connected to /retro namespace (ID: ${socket?.id})`,
          'color: #10b981; font-weight: bold;'
        );
      });

      socket.on('disconnect', (reason) => {
        console.log(
          `%c⚡ [Socket.io] Disconnected from /retro: ${reason}`,
          'color: #f59e0b; font-weight: bold;'
        );
      });

      socket.on('connect_error', (error) => {
        console.warn('⚠️ [Socket.io] Connection Error:', error.message);
      });
    }
  }

  return socket;
};

/**
 * Disconnects and tears down the active socket instance.
 */
export const disconnectRetroSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
