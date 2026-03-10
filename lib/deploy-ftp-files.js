import { Client } from "basic-ftp";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseArgs } from './args-parser.js';
import { parseEnvContent, addVersionToFilename, DeployConfig } from './osf-node-utils.js';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//console.log("filename:" + __filename);
//console.log("dirname:" + __dirname);

export async function deployFtpFiles() {
  const args = parseArgs();

  let deployConfig = new DeployConfig();

  // Argüman kontrolü ve yardım mesajı
  if (args.help || args.h) {
    // package.json'dan versiyon al
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    deployConfig.objPackageJson = packageJson;
    console.log(`orak-deploy-ftp-files version ${packageJson.version}`);
    console.log('Kullanım: orak-deploy-ftp-files');
    console.log('');
    console.log('Konfigürasyon: .env dosyasında FTP bilgileri gerekli.');
    process.exit(0);
  }

  console.log("🚀 FTP Deploy Files Başlatılıyor...");

  const projectRoot = process.cwd();
  deployConfig.pathProjectRoot = projectRoot;

  //console.log("Project Root:"+ projectRoot);
  //Project Root:Y:\devrepo-oraksoft-web\oraksoft-node-tools

  // .env.orakconfig dosyasını oku
  const pathEnvOrakConfig = path.join(projectRoot, '.env.orakconfig');

  //console.log("envPath:" + pathEnvOrakConfig);
  //envPath:Y:\devrepo-oraksoft-web\oraksoft-node-tools\.env.orakconfig

  if (!fs.existsSync(pathEnvOrakConfig)) {
    console.error(`
❌ .env.orakconfig dosyası bulunamadı!

.env.orakconfig dosyası oluşturun ve şu bilgileri ekleyin:
osf_ftp_host=ftp.example.com
osf_ftp_user=username
osf_ftp_password=password
osf_ftp_secure=false
`);
    process.exit(1);
  }

  // .env.xx dosyasını parse et
  const envContent = fs.readFileSync(pathEnvOrakConfig, 'utf-8');
  const envVars = parseEnvContent(envContent);

  let ftpHost = envVars.osf_ftp_host;
  const ftpUser = envVars.osf_ftp_user;
  const ftpPassword = envVars.osf_ftp_password;
  const ftpSecure = envVars.osf_ftp_secure === 'true';

  // osf_ftp_local_file support with profile suffix (osf_ftp_local_file_{profile})
  let remotePathKey = 'dff_remote_path';

  if (args.profile || args.p) {
    args.profile = args.profile || args.p;
    console.log(`🔖 Profil kullanılıyor: ${args.profile}`);
    remotePathKey = remotePathKey + '_' + args.profile;
  }

  //let localFileName = envVars[localFileKey];
  let remotePath = envVars[remotePathKey];

  if (!ftpHost || !remotePath) {
    const pathOrakConfigJson = path.join(projectRoot, 'orak-config.json');

    if (fs.existsSync(pathOrakConfigJson)) {
      //orak-config.json dosyasını oku
      const jsonOrakConfig = JSON.parse(fs.readFileSync(pathOrakConfigJson, 'utf-8'));
      deployConfig.objOrakConfig = jsonOrakConfig;

      ftpHost = ftpHost ?? jsonOrakConfig.osf_ftp_host;
      remotePath = remotePath ?? deployConfig.objOrakConfig[remotePathKey] ?? '';
      //remotePath = remotePath ?? '/';
    }
  }

  // Eğer --v verilmişse filename uzantısının öncesine versiyon ekle (örn: test-1_2_3.txt veya deploy-1_2_3.tar.gz)
  // if (args.v && localFileName) {
  //   const pathPackageJsonPath = path.join(projectRoot, 'package.json');
  //   const packageJson = JSON.parse(fs.readFileSync(pathPackageJsonPath, 'utf-8'));
  //   const txVersionDotted = packageJson.version; //.replace(/\./g, '_');
  //   localFileName = addVersionToFilename(localFileName, txVersionDotted);
  //   console.log(`📦 Versiyon eklendi: ${txVersionDotted}`);
  //   console.log(`📄 Güncel dosya adı: ${localFileName}`);
  // }

  //let localFilePath1 = path.join(projectRoot, localFileName); //"dist"
  // Dosya adının sonuna rastgele karakter ekle (güvenlik için)

  if (!ftpHost || !ftpUser || !ftpPassword) {
    console.error("Error: FTP bilgileri eksik. .env.orakconfig dosyasında osf_ftp_host, osf_ftp_user ve osf_ftp_password alanlarını kontrol edin.");
    process.exit(1);
  }

  const client = new Client();
  client.ftp.verbose = true;

  /* @type {string[]} */
  const filesToArchive = deployConfig.objOrakConfig.dff_list || [];

  //  "dff_list": [
  //   {
  //     "local": ".orak-dist/test1.txt",
  //     "remote": "temp"
  //   }
  // ]

  try {
    await client.access({
      host: ftpHost,
      user: ftpUser,
      password: ftpPassword,
      secure: ftpSecure
    });

    // dff_list içindeki dosyaları yükle
    for (const objFile of filesToArchive) {
      const localFilePath = path.join(projectRoot, objFile.local);
      // remoteFilePath: remote klasör + dosya adı
      const remoteFilePath = path.posix.join(remotePath, objFile.remote, path.basename(objFile.local));
      if (!fs.existsSync(localFilePath)) {
        console.error(`Error: Yerel dosya bulunamadı: ${localFilePath}`);
        continue;
      }
      console.log(`Yükleniyor: ${localFilePath} -> ${remoteFilePath}`);
      await client.uploadFrom(localFilePath, remoteFilePath);
      console.log(`✅ Lokal: ${localFilePath}`);
      console.log(`✅ Remote: ${remoteFilePath}`);
      console.log('-----------------------------');
    }
    console.log("✅ FTP yükleme tamamlandı!");
  }
  catch (err) {
    console.error("❌ FTP Hatası:", err);
    process.exit(1);
  }
  client.close();

}



