import fs from 'fs';
import path from 'path';
import * as tar from 'tar';
import { ZipArchive } from 'archiver';
import { fileURLToPath } from 'url';
import { parseArgs } from './args-parser.js';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function makeZipContent() {
  const args = parseArgs();

  // Argüman kontrolü ve yardım mesajı
  if (args.help || args.h) {
    // package.json'dan versiyon al
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    console.log(`orak-zip-content version ${packageJson.version}`);
    console.log('Kullanım: orak-zip-content [seçenekler]');
    console.log('Belirtilen dosya ve klasörleri tar.gz (veya --zip ile ZIP) formatında arşivler.');
    console.log('Konfigürasyon: orak-config.json dosyasında "zip-content" (array) ayarı gerekli.');
    console.log('');
    console.log('Seçenekler:');
    console.log('  -v, --version      Dosya adına versiyon ekle');
    console.log('  -z, --zip          ZIP formatında arşiv oluştur (varsayılan: tar.gz)');
    console.log('  -p, --profile      Profil belirtme');
    console.log('  -h, --help         Bu yardım mesajını göster');
    process.exit(0);
  }

  // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
  const projectRoot = process.cwd();

  // orak-config.json dosyasını oku
  const pathOrakconfigJson = path.join(projectRoot, 'orak-config.json');

  if (!fs.existsSync(pathOrakconfigJson)) {
    console.error("Error: orak-config.json dosyası bulunamadı. Lütfen ekleyiniz.");
    process.exit(1);
  }

  const objOrakConfigJson = JSON.parse(fs.readFileSync(pathOrakconfigJson, 'utf-8'));

  if (!objOrakConfigJson["zip_content"] || !Array.isArray(objOrakConfigJson["zip_content"])) {
    console.error("Error: 'zip_content' alanı orak-config.json içinde bir dizi olarak tanımlanmalıdır.");
    process.exit(1);
  }

  let outputFileKey = 'zip_content_out_file';

  if (args.profile || args.p) {
    args.profile = args.profile || args.p;
    console.log(`🔖 Profil kullanılıyor: ${args.profile}`);
    outputFileKey = outputFileKey + "_" + args.profile;
  }


  let archiveName = objOrakConfigJson[outputFileKey];

  if (!archiveName) {
    console.error("Error: " + `${outputFileKey} alanı orak-config.json içinde tanımlanmalıdır.`);
    process.exit(1);
  }
  
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  let txVersionForFileName = packageJson.version.replace(/\./g, '_');

  if (args.v) {
    // Kelime Ayırıcı ekle (_) (ör. deploy-1_2_3.tar.gz) okunaklı olsun
    const txWordSeper = '-'; // archiveName.endsWith('-') || archiveName.endsWith('_') ? '' : '-';
    archiveName = archiveName + txWordSeper + txVersionForFileName;
    console.log(`📦 Versiyon eklendi: ${txVersionForFileName}`);
  }

  // Dosya adına uzantı ekle
  const isZipFormat = args.zip || args.z;
  archiveName = archiveName + (isZipFormat ? '.zip' : '.tar.gz');

  const filesToArchive = objOrakConfigJson["zip_content"];

  if (!filesToArchive) {
    console.error("Error: 'zip_content' alanı orak-config.json içinde tanımlanmalıdır.");
    process.exit(1);
  }

  // Her klasör için dosyaları topla
  const allFilesToArchive = [];

  for (const item of filesToArchive) {
    const fullPath = path.join(projectRoot, item);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Bulunamadı: ${item}`);
      continue;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Klasörün içindeki dosyaları ekle
      const walkDir = (prmDir) => {
        const files = fs.readdirSync(prmDir);
        for (const file of files) {
          const filePath = path.join(prmDir, file);
          const fileStat = fs.statSync(filePath);

          if (fileStat.isDirectory()) {
            walkDir(filePath);
          } else {
            // Klasör root'undan relative path
            const relPath = path.relative(fullPath, filePath).replace(/\\/g, '/');
            allFilesToArchive.push({
              src: filePath,
              dest: relPath
            });
          }
        }
      };
      walkDir(fullPath);
    } else {
      // Tek dosya
      allFilesToArchive.push({
        src: fullPath,
        dest: path.basename(item)
      });
    }
  }

  // dist klasörü ve arşiv adı
  const distDir = projectRoot;  // path.resolve(projectRoot, '.orak-dist');
  const archivePath = path.join(distDir, archiveName);

  // dist klasörü yoksa oluştur
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Arşiv oluştur
  try {
    // Geçici klasör oluştur
    const tempDir = path.join(distDir, '.tempZipContentFi');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Dosyaları geçici klasöre kopyala
    for (const file of allFilesToArchive) {
      const destPath = path.join(tempDir, file.dest);
      const destDir = path.dirname(destPath);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(file.src, destPath);
    }

    if (isZipFormat) {
      // ZIP formatında arşiv oluştur
      await createZipArchive(archivePath, tempDir, fs.readdirSync(tempDir));
      console.log(`✅ ZIP arşivi oluşturuldu: ${archivePath}`);
    } else {
      // tar.gz formatında arşiv oluştur
      await tar.c(
        {
          gzip: true,
          file: archivePath,
          cwd: tempDir,
          follow: true,
        },
        fs.readdirSync(tempDir)
      );
      console.log(`✅ Arşiv oluşturuldu: ${archivePath}`);
    }

    // Geçici klasörü sil
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (err) {
    console.error('❌ Arşivleme hatası:', err);
    process.exit(1);
  }
}

// ZIP arşivi oluşturma yardımcı fonksiyonu
async function createZipArchive(archivePath, sourceDir, files) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(archivePath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    output.on('error', reject);

    archive.pipe(output);

    // Dosyaları arşive ekle
    for (const item of files) {
      const itemPath = path.join(sourceDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        archive.directory(itemPath, item);
      } else {
        archive.file(itemPath, { name: item });
      }
    }

    archive.finalize();
  });
}