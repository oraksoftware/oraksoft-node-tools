import fs from 'fs';
import path from 'path';
import * as tar from 'tar';

export async function deployZip() {
  // Argüman kontrolü ve yardım mesajı
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('orak-deploy-zip version 0.0.3');
    console.log('Kullanım: orak-deploy-zip');
    console.log('Belirtilen dosya ve klasörleri tar.gz formatında arşivler.');
    console.log('Konfigürasyon: orak-config.json dosyasında "fiDeployZipContent" ayarı gerekli.');
    process.exit(0);
  }

  // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
  const projectRoot = process.cwd();

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
  const archiveName = 'deployphp25.tar.gz';
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