import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Hostinger usually provides the port in process.env.PORT
const port = process.env.PORT || 3000;

// Serve static files from the 'dist' directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Catch-all route to serve 'index.html' for all other requests (SPA support)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Internal Server Error: Missing build files');
    }
  });
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle errors
server.on('error', (err) => {
  console.error('Server failed to start:', err);
});

