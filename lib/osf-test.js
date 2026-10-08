import { osfParseArgs } from './osf-args-parser.js';
import path, { parse } from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';
import { addVersionToFilename, appendRandomToFilename, parseEnvVars, parseFileNameAndExtension } from "./osf-node-utils.js";

// @ts-ignore
//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

export async function osfTest() {
  const args = osfParseArgs();

  console.log(args);

  console.log("args[test]:",args['test']);

  let txProfile = null;
  // profile argümanı tanımlanmışsa
  args.profile = args.profile || args.p;
  txProfile = args.profile || args.p;
  console.log("txProfile:",txProfile);

  console.log("test-end");

}