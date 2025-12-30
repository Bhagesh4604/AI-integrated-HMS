import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api'; // 1. Import API_BASE

const useWebSocket = (onMessage) => {
  const ws = useRef(null);

  useEffect(() => {
    let reconnectTimeout;
    let wsInstance;

    const connect = () => {
      // 2. Construct WebSocket URL from API_BASE
      const wsUrl = API_BASE.replace(/^http/, 'ws');

      wsInstance = new WebSocket(wsUrl);
      ws.current = wsInstance;

      wsInstance.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
      };

      wsInstance.onclose = (event) => {
        console.log('WebSocket disconnected:', event.reason, `Code: ${event.code}`);
        // Attempt to reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 3000);
      };

      wsInstance.onmessage = (event) => {
        // console.log('Raw WebSocket message received:', event.data);
        try {
          const message = JSON.parse(event.data);
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsInstance.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Close event will be triggered, which handles reconnection
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (wsInstance) {
        wsInstance.onclose = null; // Prevent reconnection attempt on unmount
        wsInstance.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [onMessage]);

  return ws;
};

export default useWebSocket;
