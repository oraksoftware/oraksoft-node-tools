import path from "path";

/**
 * Çoklu uzantı desteğiyle dosya adına versiyon ekler
 * @param {string} pFileName
 * @param {string} pVersion
 * @returns {string}
 */
export function addVersionToFilename(pFileName, pVersion) {
  const txVersion = pVersion.replace(/\./g, '_');
  //const path = require('path');
  const parsed = path.parse(pFileName);
  let parsedFile = parseFileNameAndExtension(pFileName);
  // dosya uzantısı
  let ext = parsedFile.ext;
  let nameNoExt = parsedFile.name;
  const seper = '_'; // nameNoExt.endsWith('-') || nameNoExt.endsWith('_') ? '' : '-';
  const newBase = nameNoExt + seper + txVersion;
  return parsed.dir ? path.join(parsed.dir, newBase + ext) : newBase + ext;
}

export function addVersionToFilename2(pFileName, pVersion) {
  const txVersion = pVersion.replace(/\./g, '_');
  //const path = require('path');
  const parsed = path.parse(pFileName);
  const base = parsed.base;
  const multiExts = ['.tar.gz', '.tar.bz2', '.tar.xz', '.tar.lz', '.tar.Z', '.tgz'];
  // dosya uzantısı
  let ext = parsed.ext;
  let nameNoExt = parsed.name;
  for (const me of multiExts) {
    if (base.toLowerCase().endsWith(me.toLowerCase())) {
      ext = me;
      // uzantısız dosya adı (örn. deploy.tar.gz -> deploy)
      nameNoExt = base.slice(0, -me.length);
      break;
    }
  }
  const seper = '_'; // nameNoExt.endsWith('-') || nameNoExt.endsWith('_') ? '' : '-';
  const newBase = nameNoExt + seper + txVersion;
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
  
  let parsedFile = parseFileNameAndExtension(filename);
  let ext = parsedFile.ext;
  let nameNoExt = parsedFile.name;
  return nameNoExt + '_' + randomStr + ext;
}

export function appendRandomToFilename2(filename) {
  const randomStr = Math.random().toString(36).substring(2, 10); // 8 karakter
  const base = path.basename(filename);
  const firstDotIdx = base.indexOf('.');
  let nameNoExt = base;
  let ext = '';
  if (firstDotIdx !== -1) {
    nameNoExt = base.slice(0, firstDotIdx);
    ext = base.slice(firstDotIdx);
  }
  return nameNoExt + '_' + randomStr + ext;
}

/**
 * Çoklu uzantı desteğiyle dosya adı ve uzantısını parse eder
 * 
 * @param {*} filename  
 * @returns { {name: string, ext: string} } name: uzantısız dosya adı, ext: dosya uzantısı (çoklu uzantı destekli)
 */
export function parseFileNameAndExtension(filename) {
  const base = path.basename(filename);
  const firstDotIdx = base.indexOf('.');
  let nameNoExt = base;
  let ext = '';
  if (firstDotIdx !== -1) {
    nameNoExt = base.slice(0, firstDotIdx);
    ext = base.slice(firstDotIdx);
  }
  return { "name": nameNoExt, "ext": ext };
}

export class DeployConfig {
  objOrakConfig = {};
  pathProjectRoot = "";
  objPackageJson = {};
}