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

// ─── Upload Proxy (fetch direto REST Supabase + timeout 20s) ─────────────────
app.post('/api/upload-image',
  express.raw({ type: () => true, limit: '30mb' }),
  async (req, res) => {
    // Timeout de resposta do Express: 25 segundos
    res.setTimeout(25000, () => {
      res.status(504).json({ error: 'Timeout: upload demorou mais de 25s' });
    });

    try {
      const jwt        = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
      const filePath   = (req.headers['x-file-path']   || '').trim();
      const fileType   = (req.headers['x-file-type']   || 'image/jpeg').trim();
      const propertyId = (req.headers['x-property-id'] || '').trim();

      console.log('[UploadProxy] iniciando:', { filePath, fileType, propertyId, bodyLen: req.body?.length });

      if (!jwt || !filePath || !propertyId) {
        return res.status(400).json({ error: 'Parâmetros ausentes (jwt/filePath/propertyId)' });
      }
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: 'Arquivo vazio' });
      }

      const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      const SUPABASE_KEY =  process.env.VITE_SUPABASE_ANON_KEY || '';

      if (!SUPABASE_URL) {
        return res.status(500).json({ error: 'VITE_SUPABASE_URL não configurada no servidor' });
      }

      // AbortController com timeout de 20 segundos
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/property-images/${filePath}`;
      console.log('[UploadProxy] enviando para:', uploadUrl);

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': fileType,
          'x-upsert': 'false',
        },
        body: req.body,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const responseText = await uploadRes.text();
      console.log('[UploadProxy] resposta Supabase:', uploadRes.status, responseText.slice(0, 200));

      if (!uploadRes.ok) {
        return res.status(uploadRes.status).json({
          error: `Supabase Storage retornou ${uploadRes.status}: ${responseText}`,
        });
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${filePath}`;
      return res.json({ publicUrl });

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('[UploadProxy] Timeout de 20s atingido');
        return res.status(504).json({ error: 'Upload timeout: Supabase não respondeu em 20s' });
      }
      console.error('[UploadProxy] Exceção:', err.message);
      return res.status(500).json({ error: err.message || 'Erro interno no servidor' });
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

