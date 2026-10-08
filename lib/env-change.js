import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { osfParseArgs } from './osf-args-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function envChange() {
  const args = osfParseArgs();

  // Komut satırından argüman alma (named ve positional)
  // Named: --env dev veya --environment prod
  // Positional: orak-env-change dev (args._[0])
  const envArgument = args.env || args.environment || args._?.[0];
  //console.log(args);

  // Argüman kontrolü ve yardım mesajı
  if (args.help || args.h) {
    // oraksoft-node-tools package.json'dan versiyon al
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    console.log(`orak-env-change version ${packageJson.version}`);
    console.log('Kullanım: orak-env-change [ortam_adı]');
    console.log('Örnek: orak-env-change dev');
    //console.log('Argüman verilmezse orak-config.json\'daki fiEnvChangeStatus değeri kullanılır.');
    process.exit(0);
  }

  // Çalışma dizinini tespit et (komutun çalıştırıldığı yer)
  const projectRoot = process.cwd();
  
  // orak-config.json dosyasını okuma
  const configPath = path.join(projectRoot, 'orak-config.json');
  
  let jsoOrakConfig = {};
  // exists - Path olup olmadığına bakar
  if (fs.existsSync(configPath)) {
    jsoOrakConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  let txEnv = envArgument; // || jsoOrakConfig.fiEnvChangeStatus;

  if (!txEnv) {
    console.error('❌ Ortam adı belirtilmedi '); //ve orak-config.json\'da fiEnvChangeStatus bulunamadı.
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