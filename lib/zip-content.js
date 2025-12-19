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
    console.log('Konfigürasyon: orak-config.json dosyasında "zip-content" (array) ayarı gerekli.');
    process.exit(0);
  }

  // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
  const projectRoot = process.cwd();

  // .env dosyasını oku
  // const envPath = path.join(projectRoot, '.env');
  
  // if (fs.existsSync(envPath)) {
  //   const envContent = fs.readFileSync(envPath, 'utf-8');
  //   const envVars = {};
    
  //   envContent.split('\n').forEach(line => {
  //     const trimmedLine = line.trim();
  //     if (trimmedLine && !trimmedLine.startsWith('#')) {
  //       const [key, ...valueParts] = trimmedLine.split('=');
  //       if (key && valueParts.length > 0) {
  //         envVars[key.trim()] = valueParts.join('=').trim();
  //       }
  //     }
  //   });

  // }

  // orak-config.json dosyasını oku
  const configPath = path.join(projectRoot, 'orak-config.json');

  if (!fs.existsSync(configPath)) {
    console.error("Error: orak-config.json dosyası bulunamadı. Bu komutu proje kök dizininde çalıştırın.");
    process.exit(1);
  }

  const jsnOrakConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  if (!jsnOrakConfig["zip_content"] || !Array.isArray(jsnOrakConfig["zip_content"])) {
    console.error("Error: 'zip_content' alanı orak-config.json içinde bir dizi olarak tanımlanmalıdır.");
    process.exit(1);
  }

  let archiveName = jsnOrakConfig['zip_content_out_file'];

  if (!archiveName) {
    console.error("Error: 'zip_content_out_file' alanı orak-config.json içinde tanımlanmalıdır.");
    process.exit(1);
  }

  const filesToArchive = jsnOrakConfig["zip_content"];
  
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
      const walkDir = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
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
    const tempDir = path.join(distDir, '.temp');
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
    
    // Geçici klasörden arşiv oluştur
    await tar.c(
      {
        gzip: true,
        file: archivePath,
        cwd: tempDir,
        follow: true,
      },
      fs.readdirSync(tempDir)
    );
    
    // Geçici klasörü sil
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(`✅ Arşiv oluşturuldu: ${archivePath}`);
  } catch (err) {
    console.error('❌ Arşivleme hatası:', err);
    process.exit(1);
  }
}