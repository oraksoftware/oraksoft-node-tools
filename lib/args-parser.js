import minimist from 'minimist';

/**
 * Komut satırı argümanlarını parse eder
 * @param {string[]} argv - process.argv.slice(2) ile geçilir
 * @param {object} options - minimist options (opsiyonel)
 * @returns {object} Parsed argümanlar
 */
export function parseArgs(argv = process.argv.slice(2), options = {}) {
  return minimist(argv, options);
}

/**
 * Belirli bir argümanı alma (--key:value veya --key value formatları)
 * @param {string} name - Argüman adı
 * @param {string} defaultValue - Varsayılan değer
 * @returns {string} Argüman değeri
 */
export function getArg(name, defaultValue = null) {
  const args = parseArgs();
  return args[name] || defaultValue;
}
