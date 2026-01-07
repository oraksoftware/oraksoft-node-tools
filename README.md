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
    - [orak-zip-content](#orak-zip-content)
    - [orak-zip-package](#orak-zip-package)
    - [orak-env-change](#orak-env-change)
  - [Kullanım Örnekleri](#kullanım-örnekleri)
    - [1. Bağımlılık Kopyalama](#1-bağımlılık-kopyalama)
    - [2. Arşiv Oluşturma ve FTP Yükleme](#2-arşiv-oluşturma-ve-ftp-yükleme)
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
  "zip_package": ["lib/", "bin/"],
  "zip_package_out_file": ".orak-dist/deploy1.tar.gz",
  "zip_content": ["bin", "lib"],
  "zip_content_out_file": ".orak-dist/deploy.tar.gz"
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

Belirtilen dosyayı FTP sunucusuna yükler.

```bash
orak-deploy-ftp
```

**Gerekli .env.orakconfig dosyası:**

```env
osf_ftp_host=ftp.example.com
osf_ftp_user=username
osf_ftp_password=password
osf_ftp_secure=false
osf_local_file=deploy.tar.gz
osf_remote_path=/public_html
```

- `osf_ftp_host`: FTP sunucusunun adresi
- `osf_ftp_user`: FTP kullanıcı adı
- `osf_ftp_password`: FTP şifresi
- `osf_ftp_secure`: `true` FTPS kullanır, `false` FTP kullanır (varsayılan: `false`)
- `osf_local_file`: Yüklenmek istenen dosyanın proje köküne göre yolu
- `osf_remote_path`: Uzak sunucudaki hedef klasör yolu (varsayılan: `/`)
- Dosya adı otomatik olarak `osf_local_file`'ın son bölümünden alınır

**❗ Güvenlik Notları:**
- `.env.orakconfig` dosyası zaten .gitignore'da bulunuyor
- Web sunucunuzda `.env.orakconfig` dosyalarına erişimi engelleyin (.htaccess)
- Dosya izinlerini kısıtlayın: `chmod 600 .env.orakconfig`

### orak-zip-content

Belirtilen dosya ve klasörleri tar.gz formatında arşivler.

```bash
orak-zip-content
```

**Gerekli orak-config.json ayarları:**

```json
{
  "zip_content": ["bin", "lib"],
  "zip_content_out_file": ".orak-dist/deploy.tar.gz"
}
```

- `zip_content`: Arşive dahil edilecek dosya ve klasörler
- `zip_content_out_file`: Oluşturulacak arşiv dosyasının tam yolu

### orak-zip-package

Belirtilen dosya ve klasörleri tar.gz formatında paket arşivi olarak oluşturur.

```bash
orak-zip-package
```

**Gerekli orak-config.json ayarları:**

```json
{
  "zip_package": ["lib/", "bin/"],
  "zip_package_out_file": ".orak-dist/deploy1.tar.gz"
}
```

- `zip_package`: Paket arşivine dahil edilecek dosya ve klasörler
- `zip_package_out_file`: Oluşturulacak paket arşiv dosyasının tam yolu

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

### 2. Arşiv Oluşturma ve FTP Yükleme
```bash
# .env.orakconfig dosyası oluşturun ve FTP bilgilerinizi ekleyin

# İçerik arşivi oluştur
orak-zip-content

# FTP'ye yükle
orak-deploy-ftp

# Alternatif olarak paket arşivi oluştur
orak-zip-package
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