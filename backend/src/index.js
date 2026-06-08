require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());

// Create HTTP and Socket.io server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Attach socket.io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount all routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/versions', require('./routes/versions'));
app.use('/api/annotations', require('./routes/annotations'));
app.use('/api/images', require('./routes/images'));
app.use('/api/pdfs', require('./routes/pdfs'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api', require('./routes/export'));

// Setup socket room handlers
require('./socket')(io);

// Setup cron services
require('./services/cleanup');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  // Safe console.log allowed for cron/server startup information
  console.log(`NoteSync Server running at http://${HOST}:${PORT}`);
});

