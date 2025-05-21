import express from 'express';
import { createServer } from 'http';
import { setupWebSocketServer } from './websocket.js';
import projectRouter from './project/project-router.js';
import { connectDB } from './db.js';
import cors from 'cors';

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(projectRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message || 'Something broke!' });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Set up WebSocket server
    const wss = setupWebSocketServer(server);
    console.log('WebSocket server initialized');

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`WebSocket server is ready at ws://localhost:${port}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 