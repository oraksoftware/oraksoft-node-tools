import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { fileURLToPath } from 'url';
import { parseArgs } from './args-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function zipPackage() {
  const args = parseArgs();

  // Argüman kontrolü ve yardım mesajı
  if (args.help || args.h) {
    // package.json'dan versiyon al
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`orak-zip-package version ${packageJson.version}`);
    console.log('Kullanım: orak-zip-package');
    console.log('Belirtilen dosya ve klasörleri tar.gz formatında arşivler.');
    console.log('Konfigürasyon: orak-config.json dosyasında "zip_package" ayarı gerekli.');
    process.exit(0);
  }

  // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
  const projectRoot = process.cwd();

  // .env dosyasını oku
  const envPath = path.join(projectRoot, '.env');

  const envVars = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

  }
  
  // orak-config.json dosyasını oku
  const configPath = path.join(projectRoot, 'orak-config.json');

  if (!fs.existsSync(configPath)) {
    console.error("Error: orak-config.json dosyası bulunamadı. Bu komutu proje kök dizininde çalıştırın.");
    process.exit(1);
  }

  const jsnOrakConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (!jsnOrakConfig.zip_package || !Array.isArray(jsnOrakConfig.zip_package)) {
    console.error("Error: 'zip_package' alanı orak-config.json içinde bir dizi olarak tanımlanmalıdır.");
    process.exit(1);
  }

  const filesToArchive = jsnOrakConfig.zip_package;

  let out_file_key = 'zip_package_out_file';

  if(args.profile || args.p) {
    args.profile = args.profile || args.p;
    console.log(`🔖 Profil kullanılıyor: ${args.profile}`);
    out_file_key = out_file_key + "_" + args.profile;
  }

  if (!jsnOrakConfig[out_file_key]) {
    console.error("Error: " + `${out_file_key} alanı orak-config.json içinde tanımlanmalıdır.`);
    process.exit(1);
  }

  let archiveName = jsnOrakConfig[out_file_key];

  // package.json'dan versiyon al (opsiyonel --v ile eklenecek)
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  let txVersionForFileName = packageJson.version.replace(/\./g, '_');

  if (args.v) {
    // Ayırıcı ekle (örn. deploy-1_2_3.tar.gz) okunaklı olsun
    const sep = archiveName.endsWith('-') || archiveName.endsWith('_') ? '' : '-';
    archiveName = archiveName + sep + txVersionForFileName;
    console.log(`📦 Versiyon eklendi: ${txVersionForFileName}`);
  }

  // Dosya adına .tar.gz uzantısını ekle
  archiveName = archiveName + '.tar.gz';

  // dist klasörü ve arşiv adı
  const distDir = projectRoot; // path.resolve(projectRoot, 'dist');
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