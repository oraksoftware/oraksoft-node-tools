import fs from 'fs';
import path from 'path';
import * as tar from 'tar';

export async function deployZip() {
    // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
    const projectRoot = process.cwd();

    // Arşivlenecek dosya ve klasörlerin yolları
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.error("Error: package.json dosyası bulunamadı. Bu komutu bir Node.js projesi klasöründe çalıştırın.");
        process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (!packageJson.fiDeployZipContent || !Array.isArray(packageJson.fiDeployZipContent)) {
        console.error("Error: 'fiDeployZipContent' alanı package.json içinde bir dizi olarak tanımlanmalıdır.");
        process.exit(1);
    }

    const filesToArchive = packageJson.fiDeployZipContent;

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
                    if (normalizedPath.includes('/.git/') || normalizedPath.includes('/.git') || 
                        normalizedPath.includes('/tests/') || normalizedPath.includes('/tests') ||
                        normalizedPath.includes('/fi-logs/') || normalizedPath.includes('/fi-logs') ||
                        normalizedPath.includes('/.github/') || normalizedPath.includes('/.github') ||
                        normalizedPath.endsWith('.md') || normalizedPath.endsWith('phpunit.xml.dist') ||
                        normalizedPath.endsWith('.gitignore') || normalizedPath.endsWith('.gitattributes')) {
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