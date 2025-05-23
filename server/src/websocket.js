import pkg from 'ws';
const { WebSocket, WebSocketServer } = pkg;

// Store connected clients
const clients = new Set();

// WebSocket event types
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
  ERROR: 'ERROR',

  // Edit task/project
  START_EDITING_PROJECT: 'START_EDITING_PROJECT',
  STOP_EDITING_PROJECT: 'STOP_EDITING_PROJECT',
  START_EDITING_TASK: 'START_EDITING_TASK',
  STOP_EDITING_TASK: 'STOP_EDITING_TASK',
};

// Initialize WebSocket server
export function setupWebSocketServer(server) {
  const wss = new pkg.Server({ 
    server,
    path: '/ws',
    // Add WebSocket CORS configuration
    verifyClient: (info) => {
      // Allow all origins in development
      const origin = info.origin || info.req.headers.origin;
      console.log('WebSocket connection attempt from origin:', origin);
      return true;
    }
  });

  console.log('Setting up WebSocket server on path: /ws');

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    clients.add(ws);
    const clientCount = clients.size;
    console.log(`New WebSocket client connected from: ${req.socket.remoteAddress}`);
    console.log(`Total connected clients: ${clientCount}`);

    // Send initial connection success message
    ws.send(JSON.stringify({ 
      type: WS_EVENTS.CONNECTED,
      payload: { 
        message: 'Successfully connected to WebSocket server',
        timestamp: new Date().toISOString(),
        clientCount
      }
    }));

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received message:', data);
        
        // Handle ping messages
        if (data.type === 'ping') {
          ws.send('pong');
          return;
        }
        
        if (data.type && data.payload) {
          broadcastMessage(data.type, {
            ...data.payload,
            timestamp: new Date().toISOString()
          }, ws);
        }
      } catch (error) {
        console.error('Invalid message format:', error);
        ws.send(JSON.stringify({ 
          type: WS_EVENTS.ERROR, 
          payload: { 
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          }
        }));
      }
    });

    ws.on('close', (code, reason) => {
      clients.delete(ws);
      console.log('WebSocket client disconnected:', code, reason?.toString());
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Log any server-level errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

// Enhanced broadcast message with metadata
export function broadcastMessage(type, payload, excludeClient = null) {
  const message = JSON.stringify({
    type,
    payload: {
      ...payload,
      timestamp: new Date().toISOString(),
      eventId: generateEventId()
    }
  });
  
  let sentCount = 0;
  const totalClients = clients.size;
  const OPEN_STATE = 1; // WebSocket readyState = 1 means OPEN
  const activeClients = Array.from(clients).filter(client => client.readyState === OPEN_STATE).length;

  clients.forEach(client => {
    if (client.readyState === OPEN_STATE && client !== excludeClient) {
      client.send(message);
      sentCount++;
    }
  });
  
  console.log(`WebSocket Broadcast Stats:
    - Total registered clients: ${totalClients}
    - Active clients (OPEN): ${activeClients}
    - Messages sent: ${sentCount}
    - Event type: ${type}
    - Excluded client: ${excludeClient ? 'Yes' : 'No'}`);
}

// Helper function to generate unique event IDs
export function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
} 