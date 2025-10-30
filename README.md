# Oraksoft Node Tools

Node.js projeleriniz için kullanışlı CLI araçları koleksiyonu.

## Kurulum

### Global kurulum (önerilen)
```bash
pnpm install -g oraksoft-node-tools
```

### Proje bazında kurulum
```bash
pnpm install oraksoft-node-tools --save-dev
```

## Komutlar

### fi-copy-deps
Node.js bağımlılıklarınızı belirtilen klasöre kopyalar.

```bash
fi-copy-deps
```

**Gerekli package.json ayarları:**
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

### fi-deploy-ftp
Dist klasöründeki dosyaları FTP sunucusuna yükler.

```bash
fi-deploy-ftp
```

**Gerekli .env.oraksoft ayarları:**
```json
{
  "ftp_host": "ftp.example.com",
  "ftp_user": "username",
  "ftp_password": "password",
  "ftp_secure": false,
  "localFilePath": "deployphp25.tar.gz",
  "remoteFilePath": "/path/to/remote/file.tar.gz"
}
```

### fi-deploy-zip
Belirtilen dosya ve klasörleri tar.gz formatında arşivler.

```bash
fi-deploy-zip
```

**Gerekli package.json ayarları:**
```json
{
  "fiDeployZipContent": [
    "src/",
    "public/",
    "package.json"
  ]
}
```

### fi-env-change
Ortam dosyalarını (.env) değiştirir.

```bash
fi-env-change dev
# veya
fi-env-change production
```

**Opsiyonel package.json ayarları:**
```json
{
  "fiEnvChangeStatus": "dev"
}
```

Bu durumda parametre vermeden `fi-env-change` komutunu çalıştırabilirsiniz.

## Kullanım Örnekleri

### 1. Bağımlılık Kopyalama
```bash
# package.json'da tanımlanan modülleri kopyala
fi-copy-deps
```

### 2. Deployment İşlemi
```bash
# Önce arşiv oluştur
fi-deploy-zip

# Sonra FTP'ye yükle
fi-deploy-ftp
```

### 3. Ortam Değiştirme
```bash
# Development ortamına geç
fi-env-change dev

# Production ortamına geç
fi-env-change prod
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

Sorunlarınızı [GitHub Issues](https://github.com/oraksoft/oraksoft-node-tools/issues) sayfasından bildirebilirsiniz.