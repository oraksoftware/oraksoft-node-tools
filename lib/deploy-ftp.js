import { Client } from "basic-ftp";
import path from "path";
import fs from 'fs';

export async function deployFtp() {
    // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
    const projectRoot = process.cwd();

    // Arşivlenecek dosya ve klasörlerin yolları
    const oraksoftJsonPath = path.join(projectRoot, '.env.oraksoft');
    
    if (!fs.existsSync(oraksoftJsonPath)) {
        console.error("Error: .env.oraksoft dosyası bulunamadı. Bu dosyayı oluşturup FTP bilgilerinizi ekleyin.");
        process.exit(1);
    }

    const oraksoftJson = JSON.parse(fs.readFileSync(oraksoftJsonPath, 'utf-8'));

    let ftpHost = oraksoftJson.ftp_host;
    let ftpUser = oraksoftJson.ftp_user;
    let ftpPassword = oraksoftJson.ftp_password;
    let ftpSecure = oraksoftJson.ftp_secure || false;
    let localFilePath1 = path.join(projectRoot, "dist", oraksoftJson.localFilePath);
    let remoteFilePath1 = oraksoftJson.remoteFilePath;

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