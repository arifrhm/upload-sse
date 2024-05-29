const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const pool = require('./db'); // Import the database pool
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json'); // Import the generated swagger file
const multer = require('multer');
const path = require('path');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// In-memory array to store SSE clients
let clients = [];

/**
 * @route POST /upload
 * @summary Handles file upload
 * @param {object} req.file - The uploaded file
 * @return {object} 200 - A successful response with file information
 */
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Notify clients about the upload
  const fileInfo = { filename: req.file.originalname, path: req.file.path };
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(fileInfo)}\n\n`));

  res.status(200).json(fileInfo);
});

/**
 * @route GET /events
 * @summary Establishes a Server-Sent Events connection
 * @return {object} 200 - A successful connection response
 */
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add client to the clients array
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  // Remove client when connection is closed
  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

/**
 * @route GET /
 * @summary Returns a greeting message
 * @return {string} 200 - A successful response
 */
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

/**
 * @route GET /abc
 * @summary Returns a greeting message
 * @return {object} 200 - A successful response
 */
app.get('/abc', (req, res) => {
    res.status(200).json({ message: 'Welcome to the API' });
});

/**
 * @route GET /api
 * @summary Returns a welcome message for the API
 * @return {object} 200 - A successful response
 */
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the abc' });
});

/**
 * @route POST /api/users
 * @summary Creates a new user
 * @param {object} request.body.required - user information
 * @property {string} name.required - user's name
 * @property {string} email.required - user's email
 * @return {object} 201 - User created successfully
 * @return {Error} 400 - Bad request
 */
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const user = { name, email };
  pool.query('INSERT INTO users SET ?', user, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ id: results.insertId, ...user });
  });
});

/**
 * @route GET /api/users
 * @summary Returns a list of users
 * @return {array<object>} 200 - A successful response
 */
app.get('/api/users', (req, res) => {
  pool.query('SELECT * FROM users', (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
