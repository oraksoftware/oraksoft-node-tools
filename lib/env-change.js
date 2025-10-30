import fs from 'fs';
import path from 'path';

export function envChange() {

    // Komut satırından argüman alma
    // process.argv[0] = node executable
    // process.argv[1] = script dosyası
    // process.argv[2] = ilk argüman
    const envArgument = process.argv[2];

    let txEnv = envArgument || packageJson.fiEnvChangeStatus;

    // Argüman kontrolü ve yardım mesajı
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        console.log('fi-env-change version 0.0.2');
        console.log('Kullanım: fi-env-change [ortam_adı]');
        console.log('Örnek: fi-env-change dev');
        console.log('Argüman verilmezse package.json\'daki fiEnvChangeStatus değeri kullanılır.');
        process.exit(0);
    }

    // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
    const projectRoot = process.cwd();

    // Arşivlenecek dosya ve klasörlerin yolları
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    let packageJson = {};
    if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    }

    if (!txEnv) {
        console.error('❌ Ortam adı belirtilmedi ve package.json\'da fiEnvChangeStatus bulunamadı.');
        console.log('Kullanım: fi-env-change [ortam_adı]');
        process.exit(1);
    }

    try {
        // .env dosyasının içeriğini .env.{txEnv} içeriğine eşitle
        const envPath = path.join(projectRoot, '.env.' + txEnv);
        
        if (!fs.existsSync(envPath)) {
            console.error(`❌ Ortam dosyası bulunamadı: ${envPath}`);
            process.exit(1);
        }
        
        const envContent = fs.readFileSync(envPath, 'utf-8');
        fs.writeFileSync(path.join(projectRoot, '.env'), envContent);
        
        // Başarı mesajı
        console.log(`✅ Ortam dosyası başarıyla değiştirildi: .env.${txEnv} -> .env`);
        console.log(`📁 Dosya yolu: ${path.join(projectRoot, '.env')}`);
    } catch (error) {
        console.error('❌ Ortam dosyası değiştirme hatası:', error.message);
        process.exit(1);
    }
}