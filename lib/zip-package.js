import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { fileURLToPath } from 'url';
import { parseArgs } from './args-parser.js';
import { addVersionToFilename, parseEnvContent } from './osf-node-utils.js';

// @ts-ignore
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
  // const envPath = path.join(projectRoot, '.env');

  // let envVars = {};

  // if (fs.existsSync(envPath)) {
  //   const envContent = fs.readFileSync(envPath, 'utf-8');
  //   envVars = parseEnvContent(envContent);
  // }
  
  // orak-config.json dosyasını oku
  const configPath = path.join(projectRoot, 'orak-config.json');

  if (!fs.existsSync(configPath)) {
    console.error("Error: orak-config.json dosyası bulunamadı. Bu komutu proje kök dizininde çalıştırın.");
    process.exit(1);
  }

  const objOrakConfigJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (!objOrakConfigJson.zip_package || !Array.isArray(objOrakConfigJson.zip_package)) {
    console.error("Error: 'zip_package' alanı orak-config.json içinde bir dizi olarak tanımlanmalıdır.");
    process.exit(1);
  }

  const filesToArchive = objOrakConfigJson.zip_package;

  let outputFileKey = 'zip_package_out_file';

  // --profile veya -p argümanı ile profil belirtme
  if(args.profile || args.p) {
    args.profile = args.profile || args.p;
    console.log(`🔖 Profil kullanılıyor: ${args.profile}`);
    outputFileKey = outputFileKey + "_" + args.profile;
  }

  if (!objOrakConfigJson[outputFileKey]) {
    console.error(`Error : ${outputFileKey} alanı orak-config.json içinde tanımlanmalıdır.`);
    process.exit(1);
  }

  let archiveName = objOrakConfigJson[outputFileKey];

  // package.json'dan versiyon al (opsiyonel --v ile eklenecek)
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  let txVersionForFileName = packageJson.version.replace(/\./g, '_');

  if (args.v) {
    // Ayırıcı ekle (örn. deploy-1_2_3.tar.gz) okunaklı olsun
    archiveName = addVersionToFilename(archiveName, txVersionForFileName);
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