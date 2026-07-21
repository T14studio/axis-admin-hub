import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

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

// ─── Upload Proxy (binário direto — sem base64) ───────────────────────────────
// O browser envia o arquivo como bytes brutos via Content-Type do arquivo.
// O servidor repassa ao Supabase Storage. Same-origin: sem CORS.
app.post('/api/upload-image',
  express.raw({ type: '*/*', limit: '30mb' }),
  async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token ausente' });
      }
      const jwt = authHeader.slice(7);

      const filePath   = req.headers['x-file-path'];
      const fileType   = req.headers['x-file-type'] || 'image/jpeg';
      const propertyId = req.headers['x-property-id'];

      if (!filePath || !propertyId || !req.body || req.body.length === 0) {
        return res.status(400).json({ error: 'Parâmetros inválidos ou arquivo vazio' });
      }

      const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({ error: 'Configuração do servidor incompleta' });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false },
      });

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, req.body, {
          contentType: fileType,
          upsert: false,
        });

      if (uploadError) {
        console.error('[UploadProxy] Erro Supabase:', uploadError.message);
        return res.status(500).json({ error: uploadError.message });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return res.json({ publicUrl });
    } catch (err) {
      console.error('[UploadProxy] Exceção:', err);
      return res.status(500).json({ error: err.message || 'Erro interno' });
    }
  }
);
// ──────────────────────────────────────────────────────────────────────────────

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

