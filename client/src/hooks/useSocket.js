import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to the server (use REACT_APP_API_URL in production)
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:10000';
    socketRef.current = io(socketUrl, {
      withCredentials: true
    });

    return () => {
      // Disconnect when component unmounts
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};

export default useSocket;