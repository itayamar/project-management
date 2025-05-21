// WebSocket Events (must match server events)
export const WS_EVENTS = {
  // Project events
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  
  // Task events
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_DELETED: 'TASK_DELETED',
  
  // System events
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR'
};

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 1000;
    this.isConnecting = false;
    this.lastEventId = null;
    this.heartbeatInterval = null;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Handle development environment
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    console.log('Attempting WebSocket connection to:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
        
        // Set up heartbeat
        this.heartbeatInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          // Handle pong response
          if (event.data === 'pong') {
            return;
          }

          const data = JSON.parse(event.data);
          const { type, payload } = data;
          
          // Log connection info when receiving CONNECTED event
          if (type === WS_EVENTS.CONNECTED) {
            console.log('WebSocket Connection Info:', {
              type,
              clientCount: payload.clientCount,
              timestamp: payload.timestamp
            });
            return;
          }

          // Validate message format
          if (!type || !payload) {
            console.error('Invalid message format received:', data);
            return;
          }

          console.log('WebSocket received message:', {
            type,
            eventId: payload.eventId,
            timestamp: payload.timestamp
          });
          
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to process WebSocket message:', error, event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        clearInterval(this.heartbeatInterval);
        
        // Only attempt reconnect for abnormal closures
        if (event.code === 1006 || event.code === 1001) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
        this.reconnectTimeout *= 2;
      }, this.reconnectTimeout);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    
    if (!type) {
      console.error('Received message without type:', data);
      return;
    }

    // Prevent duplicate events
    if (payload.eventId && payload.eventId === this.lastEventId) {
      console.log('Duplicate event detected:', {
        currentEventId: payload.eventId,
        lastEventId: this.lastEventId,
        type
      });
      return;
    }
    this.lastEventId = payload.eventId;

    const listeners = this.listeners.get(type) || [];
    console.log('WebSocket Event Handling:', {
      type,
      listenerCount: listeners.length,
      eventId: payload.eventId,
      timestamp: payload.timestamp
    });
    
    listeners.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in listener for event ${type}:`, error);
      }
    });
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const listeners = this.listeners.get(event);
    listeners.push(callback);
    console.log(`Subscribed to ${event}, total listeners:`, listeners.length);

    return () => {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        console.log(`Unsubscribed from ${event}, remaining listeners:`, listeners.length);
      }
    };
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      console.log('Sending WebSocket message:', { type, payload });
      this.ws.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', { type, payload });
      this.connect(); // Try to reconnect
    }
  }

  close() {
    if (this.ws) {
      console.log('Closing WebSocket connection');
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService; 