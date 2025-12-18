# Oraksoft Node Tools

Node.js projeleriniz için kullanışlı CLI araçları koleksiyonu.

- [Oraksoft Node Tools](#oraksoft-node-tools)
  - [Kurulum](#kurulum)
    - [Global kurulum (önerilen)](#global-kurulum-önerilen)
    - [Proje bazında kurulum](#proje-bazında-kurulum)
  - [Konfigürasyon](#konfigürasyon)
  - [Komutlar](#komutlar)
    - [orak-copy-deps](#orak-copy-deps)
    - [orak-deploy-ftp](#orak-deploy-ftp)
    - [orak-deploy-zip](#orak-deploy-zip)
    - [orak-env-change](#orak-env-change)
  - [Kullanım Örnekleri](#kullanım-örnekleri)
    - [1. Bağımlılık Kopyalama](#1-bağımlılık-kopyalama)
    - [2. Deployment İşlemi](#2-deployment-i̇şlemi)
    - [3. Ortam Değiştirme](#3-ortam-değiştirme)
  - [Gereksinimler](#gereksinimler)
  - [Lisans](#lisans)
  - [Katkıda Bulunma](#katkıda-bulunma)
  - [Sorun Bildirimi](#sorun-bildirimi)


## Kurulum

### Global kurulum (önerilen)
```bash
pnpm install -g oraksoft-node-tools
```

### Proje bazında kurulum

```bash
pnpm install oraksoft-node-tools --save-dev
```

## Konfigürasyon

Bu araçlar `orak-config.json` dosyasını kullanarak konfigüre edilir. Bu dosyayı proje kök dizininizde oluşturun:

```json
{
  "copyDepsModulesToCopy": [
    {
      "name": "module-name",
      "file": "dist/module.js"
    }
  ],
  "copyDepsLibFolder": "lib",
  "copyDepsLibFolderEmpty": true,
  "fiDeployZipFile": "orak-deploy-zip",
  "fiDeployZipContent": [
    "src/",
    "public/",
    "package.json"
  ],
  "fiEnvChangeStatus": "dev"
}
```

## Komutlar

### orak-copy-deps

Node.js bağımlılıklarınızı belirtilen klasöre kopyalar.

```bash
orak-copy-deps
```

**Gerekli orak-config.json ayarları:**

```json
{
  "copyDepsModulesToCopy": [
    {
      "name": "module-name",
      "file": "dist/module.js"
    }
  ],
  "copyDepsLibFolder": "lib",
  "copyDepsLibFolderEmpty": true
}

```

### orak-deploy-ftp

Dist klasöründeki dosyaları FTP sunucusuna yükler.

```bash
orak-deploy-ftp
```

**Gerekli .env dosyası:**

```env
osf_ftp_host=ftp.example.com
osf_ftp_user=username
osf_ftp_password=password
osf_ftp_secure=false
osf_local_file=orak-deploy-zip.tar.gz
osf_remote_path=/public_html
```

- `osf_local_file` belirtilmezse, `orak-config.json`'daki `fiDeployZipFile` değeri kullanılır
- `osf_remote_path` uzak sunucudaki hedef klasör yolunu belirtir, dosya adı otomatik olarak `osf_local_file`'dan alınır

**❗ Güvenlik Notları:**
- `.env` dosyası zaten .gitignore'da bulunuyor
- Web sunucunuzda `.env` dosyalarına erişimi engelleyin (.htaccess)
- Dosya izinlerini kısıtlayın: `chmod 600 .env`

### orak-deploy-zip
Belirtilen dosya ve klasörleri tar.gz formatında arşivler.

```bash
orak-deploy-zip
```

**Gerekli orak-config.json ayarları:**
```json
{
  "fiDeployZipFile": "orak-deploy-zip",
  "fiDeployZipContent": [
    "src/",
    "public/",
    "package.json"
  ]
}
```

- `fiDeployZipFile`: Oluşturulacak arşiv dosyasının adı (.tar.gz uzantısı otomatik eklenir)
- `fiDeployZipContent`: Arşive dahil edilecek dosya ve klasörler

### orak-env-change
Ortam dosyalarını (.env) değiştirir.

```bash
orak-env-change dev
# veya
orak-env-change production
```

**Opsiyonel orak-config.json ayarları:**
```json
{
  "fiEnvChangeStatus": "dev"
}
```

Bu durumda parametre vermeden `orak-env-change` komutunu çalıştırabilirsiniz.

## Kullanım Örnekleri

### 1. Bağımlılık Kopyalama
```bash
# orak-config.json'da tanımlanan modülleri kopyala
orak-copy-deps
```

### 2. Deployment İşlemi
```bash
# .env dosyası oluşturun ve FTP bilgilerinizi ekleyin
# Önce arşiv oluştur
orak-deploy-zip

# Sonra FTP'ye yükle
orak-deploy-ftp
```

### 3. Ortam Değiştirme
```bash
# Development ortamına geç
orak-env-change dev

# Production ortamına geç
orak-env-change prod
```

## Gereksinimler

- Node.js >= 14.0.0
- NPM veya Yarn

## Lisans

MIT

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Sorun Bildirimi

Sorunlarınızı [GitHub Issues](https://github.com/oraksoftware/oraksoft-node-tools/issues) sayfasından bildirebilirsiniz.