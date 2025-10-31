import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function envChange() {

    // Komut satırından argüman alma
    // process.argv[0] = node executable
    // process.argv[1] = script dosyası
    // process.argv[2] = ilk argüman
    const envArgument = process.argv[2];

    // Argüman kontrolü ve yardım mesajı
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        // package.json'dan versiyon al
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        console.log(`orak-env-change version ${packageJson.version}`);
        console.log('Kullanım: orak-env-change [ortam_adı]');
        console.log('Örnek: orak-env-change dev');
        console.log('Argüman verilmezse orak-config.json\'daki fiEnvChangeStatus değeri kullanılır.');
        process.exit(0);
    }

    // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
    const projectRoot = process.cwd();

    // orak-config.json dosyasını oku
    const configPath = path.join(projectRoot, 'orak-config.json');
    
    let config = {};
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }

    let txEnv = envArgument || config.fiEnvChangeStatus;

    if (!txEnv) {
        console.error('❌ Ortam adı belirtilmedi ve orak-config.json\'da fiEnvChangeStatus bulunamadı.');
        console.log('Kullanım: orak-env-change [ortam_adı]');
        console.log('Alternatif: orak-config.json dosyasında "fiEnvChangeStatus" değeri tanımlayın.');
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