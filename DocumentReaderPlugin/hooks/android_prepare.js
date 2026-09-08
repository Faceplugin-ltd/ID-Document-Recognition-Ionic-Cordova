#!/usr/bin/env node
/**
 * Cordova after_prepare / before_build / before_run:
 * Disable Jetifier (huge AARs OOM Jetifier), raise heap, fix splash colors.
 */
const fs = require('fs');
const path = require('path');

function prepareAndroid(projectRoot) {
  const androidDir = path.join(projectRoot, 'platforms', 'android');
  if (!fs.existsSync(androidDir)) return;

  const gp = path.join(androidDir, 'gradle.properties');
  if (fs.existsSync(gp)) {
    let text = fs.readFileSync(gp, 'utf8');
    const ensure = (key, value) => {
      const re = new RegExp(`^\\s*${key}=.*$`, 'm');
      if (re.test(text)) text = text.replace(re, `${key}=${value}`);
      else text += `\n${key}=${value}\n`;
    };
    ensure('android.useAndroidX', 'true');
    ensure('android.enableJetifier', 'false');
    ensure('org.gradle.jvmargs', '-Xmx4096m -Dfile.encoding=UTF-8');
    fs.writeFileSync(gp, text);
    console.log('[document-reader-cordova] gradle.properties: Jetifier off, heap 4g');
  }

  const colors = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'colors.xml');
  if (fs.existsSync(colors)) {
    let text = fs.readFileSync(colors, 'utf8');
    const fixed = text.replace(/>0x([0-9a-fA-F]{8})</g, '>#$1<');
    if (fixed !== text) {
      fs.writeFileSync(colors, fixed);
      console.log('[document-reader-cordova] Fixed colors.xml hex format');
    }
  }
}

module.exports = function (ctx) {
  const projectRoot =
    (ctx && ctx.opts && ctx.opts.projectRoot) ||
    process.argv[2] ||
    process.cwd();
  prepareAndroid(projectRoot);
};

// Allow `node hooks/android_prepare.js <projectRoot>`
if (require.main === module) {
  prepareAndroid(process.argv[2] || process.cwd());
}
