import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000'; // Your backend server URL

let socket = null;

export const connectSocket = (userId) => {
  socket = io(SOCKET_URL, {
    auth: { userId },
    transports: ['websocket']
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
