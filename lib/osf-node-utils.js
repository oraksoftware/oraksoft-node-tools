import path from "path";

/**
 * Çoklu uzantı desteğiyle dosya adına versiyon ekler
 * @param {string} fileName
 * @param {string} version
 * @returns {string}
 */
export function addVersionToFilename(fileName, version) {
  const txVersion = version.replace(/\./g, '_');
  //const path = require('path');
  const parsed = path.parse(fileName);
  const base = parsed.base;
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
  const seprtr = nameNoExt.endsWith('-') || nameNoExt.endsWith('_') ? '' : '-';
  const newBase = nameNoExt + seprtr + txVersion;
  return parsed.dir ? path.join(parsed.dir, newBase + ext) : newBase + ext;
}
// .env benzeri dosya içeriğini parse eden util fonksiyonu
export function parseEnvContent(envContent) {
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
  return envVars;
}

export function appendRandomToFilename(filename) {
  const parsed = path.parse(filename);
  const randomStr = Math.random().toString(36).substring(2, 10); // 8 karakter
  // Çoklu uzantı desteği
  const multiExts = ['.tar.gz', '.tar.bz2', '.tar.xz', '.tar.lz', '.tar.Z', '.tgz'];
  let ext = parsed.ext;
  let nameNoExt = parsed.name;
  for (const me of multiExts) {
    if (parsed.base.endsWith(me)) {
      ext = me;
      nameNoExt = parsed.base.slice(0, -me.length);
      break;
    }
  }
  return nameNoExt + '_' + randomStr + ext;
}

export class DeployConfig {
  objOrakConfig = {};
  pathProjectRoot = "";
  objPackageJson = {};
}