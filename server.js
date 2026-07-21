import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import multer from 'multer';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

// Multer: armazena uploads em memória (sem gravar em disco)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

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

// ─── Upload Proxy (multipart/form-data via multer) ───────────────────────────
app.post('/api/upload-image',
  upload.single('file'),  // multer parseia o multipart e expõe req.file
  async (req, res) => {
    res.setTimeout(25000, () => res.status(504).json({ error: 'Express timeout 25s' }));
    try {
      if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({ error: 'Arquivo ausente ou vazio' });
      }

      const propertyId   = (req.body.propertyId  || '').trim();
      const displayOrder = parseInt(req.body.displayOrder || '0', 10);
      const isMain       = req.body.isMain === 'true';
      const fileExt      = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
      const uniqueName   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath     = `${propertyId}/${uniqueName}`;
      const fileType     = req.file.mimetype || 'image/jpeg';

      console.log('[Upload] inicio:', { filePath, fileType, propertyId, displayOrder, isMain, bytes: req.file.buffer.length });

      if (!propertyId) {
        return res.status(400).json({ error: 'propertyId ausente' });
      }

      // Usar defaults hardcoded caso env vars não estejam disponíveis no Hostinger
      const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://kubfzjfjvovbdlqchhgh.supabase.co').replace(/\/$/, '');
      const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzY5MTgsImV4cCI6MjA2NDY1MjkxOH0.1hGFnjV2sBvPfMCWgJzS1_RkGHe_gZ9LLqPpGbMlqMo';

      // ── 1. Upload para o Supabase Storage via HTTPS nativo ──────────────────
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/property-images/${filePath}`;
      console.log('[Upload] enviando para Supabase Storage:', uploadUrl.slice(0, 80));

      const result = await httpsPost(uploadUrl, {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': fileType,
        'x-upsert': 'false',
      }, req.file.buffer);

      console.log('[Upload] Storage respondeu:', result.status, result.body.slice(0, 200));

      if (result.status >= 400) {
        return res.status(result.status).json({
          error: `Storage ${result.status}: ${result.body}`,
        });
      }

      // ── 2. Inserir referência no banco de dados ─────────────────────────────
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/property-images/${filePath}`;

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error: dbError } = await supabaseAdmin.from('property_images').insert({
        property_id: propertyId,
        image_url: publicUrl,
        display_order: displayOrder,
        is_main: isMain,
      });

      if (dbError) {
        console.error('[Upload] Erro ao inserir no banco:', dbError.message);
        return res.status(500).json({ error: `DB: ${dbError.message}`, publicUrl });
      }

      console.log('[Upload] Sucesso! publicUrl:', publicUrl);
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

