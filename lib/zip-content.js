import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { fileURLToPath } from 'url';
import { parseArgs } from './args-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployZipContent() {
  const args = parseArgs();
  
  // Argüman kontrolü ve yardım mesajı
  if (args.help || args.h) {
    // package.json'dan versiyon al
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    console.log(`orak-zip-content version ${packageJson.version}`);
    console.log('Kullanım: orak-zip-content');
    console.log('Belirtilen dosya ve klasörleri tar.gz formatında arşivler.');
    console.log('Konfigürasyon: orak-config.json dosyasında "fiDeployZipContent" ayarı gerekli.');
    process.exit(0);
  }

  // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
  const projectRoot = process.cwd();

  // .env dosyasını oku
  const envPath = path.join(projectRoot, '.env');
  let archiveName = 'deploy.tar.gz';
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    if (envVars.osf_local_file) {
      archiveName = envVars.osf_local_file;
    }
  }

  // orak-config.json dosyasını oku
  const configPath = path.join(projectRoot, 'orak-config.json');

  if (!fs.existsSync(configPath)) {
    console.error("Error: orak-config.json dosyası bulunamadı. Bu komutu proje kök dizininde çalıştırın.");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (!config.fiDeployZipContent || !Array.isArray(config.fiDeployZipContent)) {
    console.error("Error: 'fiDeployZipContent' alanı orak-config.json içinde bir dizi olarak tanımlanmalıdır.");
    process.exit(1);
  }

  const filesToArchive = config.fiDeployZipContent;

  // dist klasörü ve arşiv adı
  const distDir = path.resolve(projectRoot, 'dist');
  const archivePath = path.join(distDir, archiveName);

  // dist klasörü yoksa oluştur
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Arşiv oluştur
  try {
    await tar.c(
      {
        gzip: true,
        file: archivePath,
        cwd: projectRoot,
        follow: true, // symlink/junction'ları takip et
        filter: (path, stat) => {
          // .git klasörlerini ve test dosyalarını hariç tut
          const normalizedPath = path.replace(/\\/g, '/');
          if (normalizedPath.includes('/.git/')
            || normalizedPath.includes('/.git')
            || normalizedPath.includes('/tests/')
            || normalizedPath.includes('/tests')
            || normalizedPath.includes('/fi-logs/')
            || normalizedPath.includes('/fi-logs')
            || normalizedPath.includes('/.github/')
            || normalizedPath.includes('/.github')
            || normalizedPath.endsWith('.md')
            || normalizedPath.endsWith('phpunit.xml.dist')
            || normalizedPath.endsWith('.gitignore')
            || normalizedPath.endsWith('.gitattributes')
          ) {
            console.log('Excluding:', path);
            return false;
          }
          return true;
        }
      },
      filesToArchive
    );
    console.log(`✅ Arşiv oluşturuldu: ${archivePath}`);
  } catch (err) {
    console.error('❌ Arşivleme hatası:', err);
    process.exit(1);
  }
}