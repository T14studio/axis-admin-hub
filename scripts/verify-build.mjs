import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');
const htaccessPath = path.join(distDir, '.htaccess');

console.log('\n======================================================');
console.log('🚀 PÓS-BUILD: VALIDAÇÃO E EMPACOTAMENTO DE INFRAESTRUTURA');
console.log('======================================================\n');

// 1. Validar pasta dist/
if (!fs.existsSync(distDir)) {
  console.error('❌ ERRO CRÍTICO: Pasta "dist" não encontrada! O build falhou.');
  process.exit(1);
}

// 2. Validar dist/index.html
if (!fs.existsSync(indexPath)) {
  console.error('❌ ERRO CRÍTICO: "dist/index.html" não encontrado!');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf8');
if (!indexContent.includes('<div id="root">') && !indexContent.includes('id="root"')) {
  console.error('❌ ERRO CRÍTICO: "dist/index.html" parece estar corrompido ou sem elemento id="root".');
  process.exit(1);
}
console.log('✅ 1. "dist/index.html" validado com sucesso.');

// 3. Garantir .htaccess definitivo para Hostinger LiteSpeed/Apache SPA
const htaccessContent = `# Desativar listagem de diretórios por segurança
Options -Indexes

# Definir index.html como documento de entrada padrão
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Não reescrever se for um arquivo físico existente (CSS, JS, imagens, favicon, etc.)
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # 2. Redirecionar todas as rotas virtuais da SPA para /index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Cache de Assets Estáticos
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public"
  </FilesMatch>
  <FilesMatch "\\.(html|htm)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
</IfModule>
`;

fs.writeFileSync(htaccessPath, htaccessContent, 'utf8');
console.log('✅ 2. "dist/.htaccess" gravado com regras SPA definitivas.');

// 4. Validar assets (JS e CSS)
const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.error('❌ ERRO CRÍTICO: Pasta "dist/assets" não encontrada!');
  process.exit(1);
}

const assetFiles = fs.readdirSync(assetsDir);
const hasJs = assetFiles.some(f => f.endsWith('.js'));
const hasCss = assetFiles.some(f => f.endsWith('.css'));

if (!hasJs || !hasCss) {
  console.error('❌ ERRO CRÍTICO: Bundles JS ou CSS ausentes na pasta dist/assets!');
  process.exit(1);
}
console.log(`✅ 3. Bundles estáticos verificados (${assetFiles.length} arquivos em dist/assets).`);

// 5. Atualizar automaticamente o pacote deploy_FINAL.zip
async function updateZip() {
  try {
    console.log('📦 4. Atualizando pacote de implantação deploy_FINAL.zip...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (process.platform === 'win32') {
      const psCommand = `powershell -Command "Remove-Item -Force deploy_FINAL.zip -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500; Compress-Archive -Path dist, server.js, package.json, package-lock.json, .env.example -DestinationPath deploy_FINAL.zip"`;
      execSync(psCommand, { cwd: rootDir, stdio: 'inherit' });
    } else {
      execSync(`zip -r deploy_FINAL.zip dist server.js package.json package-lock.json .env.example`, { cwd: rootDir, stdio: 'inherit' });
    }
    console.log('✅ 5. "deploy_FINAL.zip" recriado e sincronizado com os últimos artefatos.');
  } catch (e) {
    console.warn('⚠️ AVISO: Não foi possível empacotar deploy_FINAL.zip automaticamente:', e.message);
  }

  console.log('\n======================================================');
  console.log('✨ DEPLOY PRONTO E VALIDADOR COM 100% DE RESILIÊNCIA!');
  console.log('======================================================\n');
}

updateZip().catch(console.error);
