import { Client } from "basic-ftp";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployFtp() {
    // Argüman kontrolü ve yardım mesajı
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        // package.json'dan versiyon al
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        console.log(`orak-deploy-ftp version ${packageJson.version}`);
        console.log('Kullanım: orak-deploy-ftp');
        console.log('Dist klasöründeki dosyaları FTP sunucusuna yükler.');
        console.log('Konfigürasyon: .env dosyasında FTP bilgileri gerekli.');
        process.exit(0);
    }

    const projectRoot = process.cwd();

    // .env dosyasını oku
    const envPath = path.join(projectRoot, '.env');
    
    if (!fs.existsSync(envPath)) {
        console.error(`
❌ .env dosyası bulunamadı!

.env dosyası oluşturun ve şu bilgileri ekleyin:
ftp_host=ftp.example.com
ftp_user=username
ftp_password=password
ftp_secure=false
local_file=deployphp25.tar.gz
remote_file=/path/to/remote/file.tar.gz
        `);
        process.exit(1);
    }

    // .env dosyasını parse et
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    const ftpHost = envVars.ftp_host;
    const ftpUser = envVars.ftp_user;
    const ftpPassword = envVars.ftp_password;
    const ftpSecure = envVars.ftp_secure === 'true';
    const localFileName = envVars.local_file;
    const remoteFilePath1 = envVars.remote_file;

    let localFilePath1 = path.join(projectRoot, "dist", localFileName);

    if (!ftpHost || !ftpUser || !ftpPassword) {
        console.error("Error: FTP bilgileri eksik. .env.oraksoft dosyasında ftp_host, ftp_user ve ftp_password alanlarını kontrol edin.");
        process.exit(1);
    }

    const client = new Client();
    client.ftp.verbose = true;
    
    try {
        await client.access({
            host: ftpHost,
            user: ftpUser,
            password: ftpPassword,
            secure: ftpSecure
        });
        
        const localFilePath = localFilePath1;
        const remoteFilePath = remoteFilePath1;
        
        if (!fs.existsSync(localFilePath)) {
            console.error(`Error: Yerel dosya bulunamadı: ${localFilePath}`);
            process.exit(1);
        }
        
        console.log(`Yükleniyor: ${localFilePath} -> ${remoteFilePath}`);
        await client.uploadFrom(localFilePath, remoteFilePath);
        console.log("✅ FTP yükleme tamamlandı!");
    }
    catch(err) {
        console.error("❌ FTP Hatası:", err);
        process.exit(1);
    }
    client.close();
}