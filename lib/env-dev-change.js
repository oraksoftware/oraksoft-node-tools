import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from './args-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function envDevChange() {
  const args = parseArgs();

  // Komut satırından argüman alma (named ve positional)
  // Named: --env dev veya --environment prod
  // Positional: orak-env-dev-change dev (args._[0])
  const envArgument = args.env || args.environment || args._?.[0];
  //console.log(args);

  // Argüman kontrolü ve yardım mesajı
  if (args.help || args.h) {
    // oraksoft-node-tools package.json'dan versiyon al
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    console.log(`orak-env-dev-change version ${packageJson.version}`);
    console.log('Kullanım: orak-env-dev-change [ortam_adı]');
    console.log('Örnek: orak-env-dev-change dev');
    process.exit(0);
  }

  // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
  const projectRoot = process.cwd();
  
  // orak-config.json dosyasını okuma
  // const configPath = path.join(projectRoot, 'orak-config.json');
  
  // let objOrakConfigJson = {};
  // // exists - Path olup olmadığına bakar
  // if (fs.existsSync(configPath)) {
  //   objOrakConfigJson = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  // }

  let txEnv = envArgument; // || objOrakConfigJson.fiEnvDevChangeStatus;

  if (!txEnv) {
    console.error('❌ Ortam adı belirtilmedi '); 
    console.log('Kullanım: orak-env-dev-change [ortam_adı]');
    //console.log('Alternatif: orak-config.json dosyasında "fiEnvDevChangeStatus" değeri tanımlayın.');
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
    fs.writeFileSync(path.join(projectRoot, '.env.development'), envContent);

    // Başarı mesajı
    console.log(`✅ Ortam dosyası başarıyla değiştirildi: .env.${txEnv} -> .env.development`);
    console.log(`📁 Dosya yolu: ${path.join(projectRoot, '.env.development')}`);
  } catch (error) {
    console.error('❌ Ortam dosyası değiştirme hatası:', error.message);
    process.exit(1);
  }
}