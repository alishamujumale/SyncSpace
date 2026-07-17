import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api';

const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socketUrl = API_BASE_URL;
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