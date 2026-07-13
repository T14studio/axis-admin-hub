import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Hostinger/Nginx load balancer)
const port = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://*.supabase.co"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.supabase.co", "blob:"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

console.log('--- Hostinger Node.js Startup ---');
console.log('Timestamp:', new Date().toISOString());
console.log('Requested Port:', process.env.PORT);
console.log('Falling back to:', port);

const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Log directory state for debugging
if (!fs.existsSync(distPath)) {
  console.error('CRITICAL: "dist" folder NOT FOUND. Ensure "npm run build" was executed.');
} else if (!fs.existsSync(indexPath)) {
  console.error('CRITICAL: "dist/index.html" NOT FOUND. Build might be incomplete.');
} else {
  console.log('Success: "dist" folder and "index.html" found.');
}

// Serve static files from 'dist'
app.use(express.static(distPath));

// Health check for monitoring
app.get('/health', (req, res) => res.status(200).send('OK'));

// Catch-all route for SPA (Single Page Application)
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Error: dist/index.html not found. Check build logs.');
  }
});

const server = app.listen(port, () => {
  console.log(`Server is running successfully on port ${port}`);
});

server.on('error', (err) => {
  console.error('FATAL: Server failed to start:', err.message);
});

