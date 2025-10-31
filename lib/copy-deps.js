import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function copyDeps() {
    // Argüman kontrolü ve yardım mesajı
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        // package.json'dan versiyon al
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        console.log(`orak-copy-deps version ${packageJson.version}`);
        console.log('Kullanım: orak-copy-deps');
        console.log('Node.js bağımlılıklarınızı belirtilen klasöre kopyalar.');
        console.log('Konfigürasyon: orak-config.json dosyasında "copyDepsModulesToCopy" ve "copyDepsLibFolder" ayarları gerekli.');
        process.exit(0);
    }

    // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
    const projectRoot = process.cwd();
    const srcDir = path.join(projectRoot, 'node_modules');

    // orak-config.json dosyasını oku
    const configPath = path.join(projectRoot, 'orak-config.json');
    
    if (!fs.existsSync(configPath)) {
        console.error("Error: orak-config.json dosyası bulunamadı. Bu komutu proje kök dizininde çalıştırın.");
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (!config.copyDepsModulesToCopy || !Array.isArray(config.copyDepsModulesToCopy)) {
        console.error("Error: 'copyDepsModulesToCopy' alanı orak-config.json içinde bir dizi olarak tanımlanmalıdır.");
        process.exit(1);
    }

    if (typeof config.copyDepsLibFolder !== "string") {
        console.error("Error: 'copyDepsLibFolder' alanı orak-config.json içinde bir string olarak tanımlanmalıdır.");
        process.exit(1);
    }

    // copyDepsLibFolder dizinini belirle
    const destDir = path.join(projectRoot, config.copyDepsLibFolder);

    if (config.copyDepsLibFolderEmpty) {
        if (fs.existsSync(destDir)) {
            fs.rmSync(destDir, { recursive: true, force: true });
            console.log(`Deleted ${destDir} and its contents.`);
        }
    }

    // Klasörü oluştur
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // 📌 Kopyalanacak dosyaları belirle
    const modulesToCopy = config.copyDepsModulesToCopy;

    modulesToCopy.forEach(({ name, file }) => {
        const modPath = path.join(srcDir, name, file); // Kaynak dosya
        const moduleDestDir = path.join(destDir, name); // Hedef bağımlılık klasörü
        const destPath = path.join(moduleDestDir, path.basename(file)); // Hedef dosya

        // Hedef bağımlılık klasörünü oluştur
        if (!fs.existsSync(moduleDestDir)) {
            fs.mkdirSync(moduleDestDir, { recursive: true });
        }

        if (!fs.existsSync(destPath)) { // Eğer dosya yoksa kopyala
            if (fs.existsSync(modPath)) {
                fs.cpSync(modPath, destPath, { recursive: false });
                console.log(`✅ Copied: ${modPath} → ${destPath}`);
            } else {
                console.error(`❌ Error: ${modPath} not found!`);
            }
        } else {
            console.log(`⚠️ Skipped (already exists): ${destPath}`);
        }
    });

    console.log("🎉 Dependency sync process completed!");
}