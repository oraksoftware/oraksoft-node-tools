import fs from 'fs';
import path from 'path';

export function copyDeps() {
    // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
    const projectRoot = process.cwd();
    const srcDir = path.join(projectRoot, 'node_modules');

    // package.json dosyasını oku
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.error("Error: package.json dosyası bulunamadı. Bu komutu bir Node.js projesi klasöründe çalıştırın.");
        process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (!packageJson.copyDepsModulesToCopy || !Array.isArray(packageJson.copyDepsModulesToCopy)) {
        console.error("Error: 'copyDepsModulesToCopy' alanı package.json içinde bir dizi olarak tanımlanmalıdır.");
        process.exit(1);
    }

    if (typeof packageJson.copyDepsLibFolder !== "string") {
        console.error("Error: 'copyDepsLibFolder' alanı package.json içinde bir string olarak tanımlanmalıdır.");
        process.exit(1);
    }

    // copyDepsLibFolder dizinini belirle
    const destDir = path.join(projectRoot, packageJson.copyDepsLibFolder);

    if (packageJson.copyDepsLibFolderEmpty) {
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
    const modulesToCopy = packageJson.copyDepsModulesToCopy;

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