import { Client } from "basic-ftp";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseArgs } from './args-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployFtp() {
  const args = parseArgs();

  // Argüman kontrolü ve yardım mesajı
  if (args.help || args.h) {
    // package.json'dan versiyon al
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    console.log(`orak-deploy-ftp version ${packageJson.version}`);
    console.log('Kullanım: orak-deploy-ftp');
    console.log('Dist klasöründeki dosyaları FTP sunucusuna yükler.');
    console.log('Konfigürasyon: .env dosyasında FTP bilgileri gerekli.');
    process.exit(0);
  }

  console.log("🚀 FTP Deploy Başlatılıyor...");

  const projectRoot = process.cwd();

  // .env.orakconfig dosyasını oku
  const envPath = path.join(projectRoot, '.env.orakconfig');

  if (!fs.existsSync(envPath)) {
    console.error(`
❌ .env.orakconfig dosyası bulunamadı!

.env.orakconfig dosyası oluşturun ve şu bilgileri ekleyin:
osf_ftp_host=ftp.example.com
osf_ftp_user=username
osf_ftp_password=password
osf_ftp_secure=false
osf_ftp_local_file=deploy.tar.gz
osf_ftp_remote_path=public_html
`);
    process.exit(1);
  }

  // .env.xx dosyasını parse et
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

  let ftpHost = envVars.osf_ftp_host;
  const ftpUser = envVars.osf_ftp_user;
  const ftpPassword = envVars.osf_ftp_password;
  const ftpSecure = envVars.osf_ftp_secure === 'true';

  // osf_ftp_local_file support with profile suffix (osf_ftp_local_file_{profile})
  let localFileKey = 'osf_ftp_local_file';
  let remotePathKey = 'osf_ftp_remote_path';
  if (args.profile) {
    console.log(`${args.profile} profil uygulandı.`);
    localFileKey = localFileKey + '_' + args.profile;
    remotePathKey = remotePathKey + '_' + args.profile;
  }
  let localFileName = envVars[localFileKey] ?? envVars.osf_ftp_local_file;
  let remotePath = envVars[remotePathKey]; // || '/';

  if (!ftpHost || !localFileName || !remotePath) {
    const pathOrakConfigJson = path.join(projectRoot, 'orak-config.json');
    if (fs.existsSync(pathOrakConfigJson)) {
      //orak-config.json dosyasını oku
      const jsonOrakConfig = JSON.parse(fs.readFileSync(pathOrakConfigJson, 'utf-8'));
      ftpHost = ftpHost ?? jsonOrakConfig.osf_ftp_host;
      localFileName = localFileName ?? jsonOrakConfig[localFileKey]; //?? jsonOrakConfig.osf_ftp_local_file)
      remotePath = remotePath ?? jsonOrakConfig[remotePathKey];
      //remotePath = remotePath ?? '/';
    }
  }

  // Eğer --v verilmişse filename uzantısının öncesine versiyon ekle (örn: test-1_2_3.txt veya deploy-1_2_3.tar.gz)
  if (args.v && localFileName) {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const txVersion = packageJson.version.replace(/\./g, '_');

    const parsed = path.parse(localFileName);
    const base = parsed.base; // filename with possible multi-part ext

    // Desteklenen çok parçalı uzantılar
    const multiExts = ['.tar.gz', '.tar.bz2', '.tar.xz', '.tar.lz', '.tar.Z', '.tgz'];
    let ext = parsed.ext;
    let nameNoExt = parsed.name;

    for (const me of multiExts) {
      if (base.endsWith(me)) {
        ext = me;
        nameNoExt = base.slice(0, -me.length);
        break;
      }
    }

    const sep = nameNoExt.endsWith('-') || nameNoExt.endsWith('_') ? '' : '-';
    const newBase = nameNoExt + sep + txVersion;
    localFileName = parsed.dir ? path.join(parsed.dir, newBase + ext) : newBase + ext;

    console.log(`📦 Versiyon eklendi: ${txVersion}`);
    console.log(`📄 Güncel dosya adı: ${localFileName}`);
  }

  let localFilePath1 = path.join(projectRoot, localFileName); //"dist"
  let remoteFilePath1 = path.posix.join(remotePath, path.basename(localFileName));

  console.log(`Yerel dosya: ${localFilePath1}`);
  console.log(`Remote adres: ${remoteFilePath1}`);

  if (!ftpHost || !ftpUser || !ftpPassword) {
    console.error("Error: FTP bilgileri eksik. .env.orakconfig dosyasında osf_ftp_host, osf_ftp_user ve osf_ftp_password alanlarını kontrol edin.");
    process.exit(1);
  }

  if (!remoteFilePath1) {
    console.error("Error: FTP bilgileri eksik. .env.orakconfig dosyasında osf_ftp_remote_path alanını kontrol edin.");
    process.exit(1);
  }

  if (!localFilePath1) {
    console.error("Error: FTP bilgileri eksik. .env.orakconfig dosyasında osf_ftp_local_file alanını kontrol edin.");
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
    console.log(`✅ Lokal: ${localFilePath}`);
    console.log(`✅ Remote: ${remoteFilePath}`);
  }
  catch (err) {
    console.error("❌ FTP Hatası:", err);
    process.exit(1);
  }
  client.close();
}