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
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://*.hostingersite.com"]
    }
  }
}));

// ─── CORS — permite requisições de qualquer subdomínio hostingersite.com ──────
// Necessário porque o Nginx pode redirecionar entre domínios alias (slatoblue.koa → slateblue-koala)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-property-id, x-display-order, x-is-main, x-file-name');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

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

// ─── Upload Proxy (JSON Base64 -> Supabase Server-side) ───────────────────────────
app.post('/api/upload-image',
  express.json({ limit: '50mb' }),
  async (req, res) => {
    res.setTimeout(30000, () => res.status(504).json({ error: 'Express timeout 30s' }));
    try {
      const { propertyId, fileName, fileType, fileBase64, displayOrder, isMain } = req.body || {};

      if (!propertyId || !fileBase64) {
        return res.status(400).json({ error: 'propertyId/fileBase64 ausentes' });
      }

      const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://kubfzjfjvovbdlqchhgh.supabase.co').replace(/\/$/, '');
      const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc';

      const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      // Extrai os bytes da string base64
      const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const ext = (fileName || 'image.jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `${propertyId}/${uniqueName}`;

      console.log('[Proxy Upload] Subindo para Supabase Storage:', filePath, 'Tamanho:', buffer.length, 'bytes');

      const { data: storageData, error: storageErr } = await supabaseServer.storage
        .from('property-images')
        .upload(filePath, buffer, {
          contentType: fileType || 'image/jpeg',
          upsert: true
        });

      if (storageErr) {
        console.error('[Proxy Upload] Erro no storage:', storageErr);
        return res.status(500).json({ error: storageErr.message });
      }

      const { data: { publicUrl } } = supabaseServer.storage
        .from('property-images')
        .getPublicUrl(filePath);

      console.log('[Proxy Upload] Inserindo no banco:', publicUrl);

      const { error: dbError } = await supabaseServer.from('property_images').insert({
        property_id: propertyId,
        image_url: publicUrl,
        display_order: parseInt(displayOrder || '0', 10),
        is_main: isMain === true || isMain === 'true',
      });

      if (dbError) {
        console.error('[Proxy Upload] Erro no banco:', dbError);
        return res.status(500).json({ error: dbError.message, publicUrl });
      }

      console.log('[Proxy Upload] SUCESSO TOTAL! publicUrl:', publicUrl);
      return res.json({ success: true, publicUrl });

    } catch (err) {
      console.error('[Proxy Upload] Exceção:', err);
      return res.status(500).json({ error: err.message || 'Erro no servidor' });
    }
  }
);
// ──────────────────────────────────────────────────────────────────────────────

// ─── Property Images Proxy (GET) ───────────────────────────────────────────────
// CAUSA RAIZ: a policy RLS de property_images usa has_admin_access(auth.uid())
// para o role 'authenticated'. O cliente Supabase JS no frontend não consegue
// satisfazer essa condição (retorna []). A anon key SÃO tem acesso (verificado).
// Este endpoint faz o SELECT server-side com a anon key e retorna as imagens.
app.get('/api/property-images/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!propertyId) return res.status(400).json({ error: 'propertyId obrigatório' });

    const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || 'https://kubfzjfjvovbdlqchhgh.supabase.co').replace(/\/$/, '');
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YmZ6amZqdm92YmRscWNoaGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTkzMzgsImV4cCI6MjA4OTUzNTMzOH0.5hgkP6ges3FyMwvmgEZMDFzVNwksNP-l6moUkm8jmvc';

    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await sb
      .from('property_images')
      .select('id, image_url, display_order, is_main')
      .eq('property_id', propertyId)
      .order('display_order');

    if (error) {
      console.error('[Property Images Proxy] Erro Supabase:', error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log('[Property Images Proxy] GET', propertyId, '→', (data || []).length, 'imagens');
    return res.json(data || []);
  } catch (err) {
    console.error('[Property Images Proxy] Exceção:', err);
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
});
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

