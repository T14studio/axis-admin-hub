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

// Parse JSON bodies (needed for upload proxy)
app.use(express.json({ limit: '50mb' }));

// ─── Upload Proxy ─────────────────────────────────────────────────────────────
// Recebe o arquivo como base64 JSON do browser e faz upload direto ao Supabase
// Evita qualquer problema de CORS no browser (same-origin request)
app.post('/api/upload-image', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação ausente' });
    }
    const jwt = authHeader.slice(7);

    const { fileBase64, fileType, filePath, propertyId } = req.body;
    if (!fileBase64 || !filePath || !propertyId) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Configuração do servidor incompleta' });
    }

    // Criar cliente Supabase com o JWT do usuário autenticado
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    });

    // Converter base64 para Buffer
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, fileBuffer, {
        contentType: fileType || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('[UploadProxy] Erro:', uploadError);
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

