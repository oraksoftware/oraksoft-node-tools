# Named Argümanlar Kullanımı

Bu projede minimist kullanılarak komut satırı argümanları parse edilmektedir.

## Desteklenen Format Türleri

### 1. Named Argümanlar (--key value)
```bash
orak-env-change --env dev
orak-env-change --environment production
orak-deploy-ftp --host ftp.example.com --user admin
```

### 2. Named Argümanlar (--key=value)
```bash
orak-env-change --env=dev
orak-deploy-ftp --host=ftp.example.com --user=admin
```

### 3. Positional Argümanlar
```bash
orak-env-change dev
orak-zip-content dist src
```

### 4. Boolean Flags
```bash
orak-copy-deps --verbose
orak-deploy-zip --help
```

## Komut Örnekleri

### orak-env-change
```bash
# Named argüman ile
orak-env-change --env dev
orak-env-change --environment production

# Positional argüman ile
orak-env-change dev

# Help mesajı
orak-env-change --help
```

### orak-env-dev-change
```bash
# Named argüman ile
orak-env-dev-change --env dev

# Positional argüman ile
orak-env-dev-change dev

# Help mesajı
orak-env-dev-change --help
```

### orak-deploy-ftp
```bash
# Temel kullanım (env dosyasından okur)
orak-deploy-ftp

# Help mesajı
orak-deploy-ftp --help
```

### orak-zip-content
```bash
# Temel kullanım (config dosyasından okur)
orak-zip-content

# Help mesajı
orak-zip-content --help
```

### orak-copy-deps
```bash
# Temel kullanım (config dosyasından okur)
orak-copy-deps

# Help mesajı
orak-copy-deps --help
```

## Minimist Kullanımı

Kodda argümanları almak için:

```javascript
import { parseArgs } from './args-parser.js';

export function myCommand() {
    const args = parseArgs();
    
    // Named argüman
    const env = args.env;           // --env dev
    const environment = args.environment;  // --environment prod
    
    // Positional argüman
    const positional = args._[0];   // ilk positional argüman
    const positional2 = args._[1];  // ikinci positional argüman
    
    // Boolean flag
    const verbose = args.verbose;   // --verbose
    const help = args.help;         // --help
    
    // Default değerle
    const port = args.port || 3000; // --port 8000
}
```

## Minimist Özellikleri

- **Esnek parsing**: Hem `--key value` hem `--key=value` formatlarını destekler
- **Positional argümanlar**: `args._` arrayında saklanır
- **Type conversion**: String dışında tipleri otomatik algılamaz (string kalır)
- **Aliases**: Named argümanları kısaltabilirsiniz

```javascript
// aliases örneği
const options = {
    alias: {
        e: 'environment',
        p: 'port'
    }
};
const args = minimist(process.argv.slice(2), options);
// Artık `-e dev` ve `--environment dev` aynı işe yarar
```
