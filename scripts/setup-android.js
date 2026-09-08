#!/usr/bin/env node
/**
 * Idempotent Android setup matching sample flow:
 *   ionic cordova plugin add ./DocumentReaderPlugin
 *   ionic cordova build/run android
 *
 * Do not rm+add the local plugin on every setup — that unregisters
 * DocumentReaderSdk from config.xml ("Class not found") if add fails.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pluginSrc = path.join(root, 'DocumentReaderPlugin');
const aar = path.join(pluginSrc, 'src', 'android', 'documentreadersdk.aar');
const pluginsDir = path.join(root, 'plugins');
const installedPlugin = path.join(pluginsDir, 'document-reader-cordova');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
}

function copy(fromRel, toRel) {
  const from = path.join(pluginSrc, fromRel);
  const to = path.join(installedPlugin, toRel);
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

function pluginRegistered() {
  try {
    const androidJson = JSON.parse(
      fs.readFileSync(path.join(pluginsDir, 'android.json'), 'utf8')
    );
    return Boolean(androidJson.installed_plugins?.['document-reader-cordova']);
  } catch {
    return false;
  }
}

function syncInstalledPluginFiles() {
  if (!fs.existsSync(installedPlugin)) return false;
  copy('plugin.xml', 'plugin.xml');
  copy('src/android/DocumentReaderSdkPlugin.kt', 'src/android/DocumentReaderSdkPlugin.kt');
  copy('src/android/ImageUtils.kt', 'src/android/ImageUtils.kt');
  copy('src/android/documentreadersdk.aar', 'src/android/documentreadersdk.aar');
  copy('src/android/aarintegration.gradle', 'src/android/aarintegration.gradle');
  copy('src/ios/DocSdkBridge.h', 'src/ios/DocSdkBridge.h');
  copy('src/ios/DocSdkBridge.mm', 'src/ios/DocSdkBridge.mm');
  copy('src/ios/DocumentReaderSdkPlugin.swift', 'src/ios/DocumentReaderSdkPlugin.swift');
  copy('lib', 'lib');
  copy('dist', 'dist');
  copy('www', 'www');
  console.log('Synced DocumentReaderPlugin sources into plugins/document-reader-cordova');
  return true;
}

if (!fs.existsSync(aar)) {
  console.error(
    'Missing DocumentReaderPlugin/src/android/documentreadersdk.aar\n' +
      'Download the Android runtime (see README → Get the runtimes) and place it there.'
  );
  process.exit(1);
}

run('npm run build');
run('npm run plugin:build');

if (!fs.existsSync(path.join(root, 'platforms', 'android'))) {
  run('npx cordova platform add android');
} else {
  console.log('platforms/android already present');
}

if (!fs.existsSync(path.join(pluginsDir, 'cordova-plugin-camera'))) {
  run('npx cordova plugin add cordova-plugin-camera');
}

if (!pluginRegistered()) {
  run('npx cordova plugin add ./DocumentReaderPlugin --nofetch --nosave');
} else {
  syncInstalledPluginFiles();
}

run('npx cordova prepare android');
console.log('\nAndroid setup complete. Run: npm run android');
