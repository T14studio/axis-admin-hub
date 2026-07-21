import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
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

// ─── Debug endpoint (confirma versão do código) ─────────────────────────────
app.get('/api/debug', (req, res) => {
  res.json({
    ok: true,
    version: 'v5-https-module',
    node: process.version,
    supabaseUrl: (process.env.VITE_SUPABASE_URL || 'NAO_DEFINIDA').slice(0, 40),
    time: new Date().toISOString(),
  });
});

// ─── Helper: upload via https nativo (funciona em qualquer versão Node.js) ─────
function httpsPost(urlStr, headers, bodyBuffer) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const options = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': bodyBuffer.length },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(new Error('Timeout 20s')); });
    req.write(bodyBuffer);
    req.end();
  });
}

// ─── Upload Proxy ─────────────────────────────────────────────────────────────
app.post('/api/upload-image',
  express.raw({ type: () => true, limit: '30mb' }),
  async (req, res) => {
    res.setTimeout(25000, () => res.status(504).json({ error: 'Express timeout 25s' }));
    try {
      const jwt        = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
      const filePath   = (req.headers['x-file-path']   || '').trim();
      const fileType   = (req.headers['x-file-type']   || 'image/jpeg').trim();
      const propertyId = (req.headers['x-property-id'] || '').trim();

      console.log('[Upload] inicio:', { filePath, fileType, propertyId, bytes: req.body?.length });

      if (!jwt || !filePath || !propertyId) {
        return res.status(400).json({ error: 'jwt/filePath/propertyId ausentes' });
      }
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: 'Arquivo vazio' });
      }

      const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      const SUPABASE_KEY =  process.env.VITE_SUPABASE_ANON_KEY || '';

      if (!SUPABASE_URL) {
        return res.status(500).json({ error: 'VITE_SUPABASE_URL não configurada' });
      }

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/property-images/${filePath}`;
      console.log('[Upload] enviando para Supabase:', uploadUrl.slice(0, 80));

      const result = await httpsPost(uploadUrl, {
        'Authorization': `Bearer ${jwt}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': fileType,
        'x-upsert': 'false',
      }, req.body);

      console.log('[Upload] Supabase respondeu:', result.status, result.body.slice(0, 200));

      if (result.status >= 400) {
        return res.status(result.status).json({
          error: `Supabase ${result.status}: ${result.body}`,
        });
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${filePath}`;
      return res.json({ publicUrl });

    } catch (err) {
      console.error('[Upload] Erro:', err.message);
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

// Serve static files from 'dist' (desativa cache de HTML para forçar atualização dos JS)
app.use(express.static(distPath, {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Health check for monitoring
app.get('/health', (req, res) => res.status(200).send('OK'));

// Catch-all route for SPA (Single Page Application)
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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

