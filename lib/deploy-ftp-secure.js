import { Client } from "basic-ftp";
import path from "path";
import fs from 'fs';

export async function deployFtp() {
    const projectRoot = process.cwd();

    // Önce environment variables'ı kontrol et
    let ftpHost = process.env.ORAK_FTP_HOST;
    let ftpUser = process.env.ORAK_FTP_USER;
    let ftpPassword = process.env.ORAK_FTP_PASSWORD;
    let ftpSecure = process.env.ORAK_FTP_SECURE === 'true';
    let localFilePath = process.env.ORAK_LOCAL_FILE;
    let remoteFilePath = process.env.ORAK_REMOTE_FILE;

    // Eğer env variables yoksa, .env.oraksoft'a fallback et
    if (!ftpHost || !ftpUser || !ftpPassword) {
        const oraksoftJsonPath = path.join(projectRoot, '.env.oraksoft');
        
        if (fs.existsSync(oraksoftJsonPath)) {
            console.log("⚠️  Environment variables bulunamadı, .env.oraksoft dosyasından okuyorum...");
            const oraksoftJson = JSON.parse(fs.readFileSync(oraksoftJsonPath, 'utf-8'));
            
            ftpHost = ftpHost || oraksoftJson.ftp_host;
            ftpUser = ftpUser || oraksoftJson.ftp_user;
            ftpPassword = ftpPassword || oraksoftJson.ftp_password;
            ftpSecure = ftpSecure || oraksoftJson.ftp_secure || false;
            localFilePath = localFilePath || oraksoftJson.localFilePath;
            remoteFilePath = remoteFilePath || oraksoftJson.remoteFilePath;
        }
    } else {
        console.log("✅ Environment variables kullanılıyor (güvenli)");
    }

    if (!ftpHost || !ftpUser || !ftpPassword) {
        console.error(`
❌ FTP bilgileri bulunamadı!

Güvenli yöntem (önerilen):
  set ORAK_FTP_HOST=ftp.example.com
  set ORAK_FTP_USER=username
  set ORAK_FTP_PASSWORD=password
  set ORAK_FTP_SECURE=false
  set ORAK_LOCAL_FILE=deployphp25.tar.gz
  set ORAK_REMOTE_FILE=/path/to/remote/file.tar.gz

Alternatif: .env.oraksoft dosyası oluşturun.
        `);
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
        
        const fullLocalPath = path.join(projectRoot, "dist", localFilePath);
        
        if (!fs.existsSync(fullLocalPath)) {
            console.error(`Error: Yerel dosya bulunamadı: ${fullLocalPath}`);
            process.exit(1);
        }
        
        console.log(`Yükleniyor: ${fullLocalPath} -> ${remoteFilePath}`);
        await client.uploadFrom(fullLocalPath, remoteFilePath);
        console.log("✅ FTP yükleme tamamlandı!");
    }
    catch(err) {
        console.error("❌ FTP Hatası:", err);
        process.exit(1);
    }
    client.close();
}