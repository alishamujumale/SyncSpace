import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to the server
    socketRef.current = io('http://localhost:5000', {
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