import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ENCRYPTION_KEY = process.env.ORAK_ENCRYPTION_KEY; // 32 byte key
const ALGORITHM = 'aes-256-gcm';

export function encryptConfig(config) {
    if (!ENCRYPTION_KEY) {
        throw new Error('ORAK_ENCRYPTION_KEY environment variable gerekli');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

export function decryptConfig(encryptedData) {
    if (!ENCRYPTION_KEY) {
        throw new Error('ORAK_ENCRYPTION_KEY environment variable gerekli');
    }
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
}

export function saveEncryptedConfig(config, filePath) {
    const encrypted = encryptConfig(config);
    fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2));
}

export function loadEncryptedConfig(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return decryptConfig(encryptedData);
}

// Konfigürasyon oluşturma utility'si
export function createEncryptedConfig() {
    const config = {
        ftp_host: "ftp.example.com",
        ftp_user: "username", 
        ftp_password: "password",
        ftp_secure: false,
        localFilePath: "deployphp25.tar.gz",
        remoteFilePath: "/path/to/remote/file.tar.gz"
    };
    
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, '.config.oraksoft.encrypted');
    
    try {
        saveEncryptedConfig(config, configPath);
        console.log('✅ Şifreli konfigürasyon oluşturuldu:', configPath);
        console.log('📝 Konfigürasyonu düzenleyin ve ORAK_ENCRYPTION_KEY environment variable\'ını ayarlayın');
    } catch (error) {
        console.error('❌ Şifreli konfigürasyon oluşturulamadı:', error.message);
    }
}