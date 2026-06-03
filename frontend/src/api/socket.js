import { io } from 'socket.io-client';

// Initialize the socket globally but wait for auth to connect
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect until logged in
  withCredentials: true,
});
