<div align="center">
<img alt="FacePlugin" src="https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/brand/logo.png" width="400"/>
</div>

#### 🌐 Company Site - [Here](https://faceplugin.com)
#### 🤗 Hugging Face - [Here](https://huggingface.co/FacePlugin-Ltd)
#### 🛟 Help Center - [Here](https://doc.faceplugin.com)
#### 🐳 Docker Hub - [Here](https://hub.docker.com/u/faceplugin)

# FacePlugin ID Document Recognition SDK — Ionic Cordova (Fully On-Premise)

> Drop Android AAR + iOS framework → add the local Cordova plugin → run on a **physical** phone (~15 min after Node / JDK are ready).
> Jump: [Quick Start](#quick-start) · [Get the runtimes](#get-the-runtimes) · [Run the demo](#run-the-demo) · [Setup](#setup-on-your-own-app) · [JS API](#about-sdk)


## Quick Start

**Prerequisites:** Node **18+**, **npm**, Cordova CLI (`npx cordova` is enough; optional `npm i -g @ionic/cli cordova`), **JDK 17**, Android SDK. iOS needs **macOS + Xcode 15+** and a **physical iPhone** (`docsdk` is device arm64 only).

Put your Apple **Team ID** in root `build.json` (see [iOS signing](#ios-signing-macos)). Gradle is bootstrapped via `scripts/with-gradle.js` (no manual `GRADLE_HOME` for Android deploy).

### Android

```bash
git clone https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova.git
cd ID-Document-Recognition-Ionic-Cordova
npm install
# place DocumentReaderPlugin/src/android/documentreadersdk.aar  (see Get the runtimes)
npm run setup:android
npm run android
```


### iOS (macOS)

```bash
git clone https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova.git
cd ID-Document-Recognition-Ionic-Cordova
npm install
# place DocumentReaderPlugin/src/ios/Frameworks/docsdk.framework  (see Get the runtimes)
# edit build.json → ios.debug.developmentTeam = your Team ID (10 chars)
npm run setup:ios
npm run ios
```

Equivalent without npm scripts:

```bash
npx cordova plugin add ./DocumentReaderPlugin
npx cordova platform add ios
npx cordova prepare ios
npx cordova run ios --device --buildConfig=build.json
```

> **Windows:** do **not** add the iOS platform. Add iOS only on macOS after placing `docsdk.framework`.

> Own app? → [Setup on your own app](#setup-on-your-own-app). Docs: [https://doc.faceplugin.com](https://doc.faceplugin.com)


## Introduction

FacePlugin **ID Document Recognition SDK for Ionic Cordova** is a fully on-device identity verification plugin for Android and iOS. Scan ID cards, passports, and driver licenses with OCR, MRZ, barcode and QR extraction, live camera overlay, gallery front/back, authenticity / document liveness, and Result / Security / Images / Raw JSON. Package / plugin id: `document-reader-cordova`. No biometric data leaves the device — built for KYC and hybrid mobile onboarding.


| Folder                  | Purpose                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| Repository root         | Ionic React demo (`config.xml`, `src/`, `www/`)                               |
| `DocumentReaderPlugin/` | Cordova plugin you add with `ionic cordova plugin add ./DocumentReaderPlugin` |


Native binaries are **not** on GitHub. Download them from Google Drive (links below).

> **Browser /** `ionic serve` **alone is not enough.** Native Document Reader APIs require a Cordova Android or iOS build.


### Main Functionalities


| Feature                              | Supported |
| ------------------------------------ | --------- |
| ID Card, Passport, and Driver License recognition  | ✓         |
| MRZ, Barcode, QR, and OCR data extraction             | ✓         |
| Document detection and type classification  | ✓         |
| Live camera locate overlay + Capture | ✓         |
| Gallery front / optional back        | ✓         |
| Result (fields, Security, images, JSON)        | ✓         |
| Authenticity / Security (document liveness)  | ✓         |


### Product List

| Platform | Repository |
|----------|------------|
| Android | [ID-Document-Recognition-Android](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Android) |
| iOS | [ID-Document-Recognition-iOS](https://github.com/Faceplugin-ltd/ID-Document-Recognition-iOS) |
| Windows | [ID-Document-Recognition-Windows](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Windows) |
| Linux / Docker | [ID-Document-Recognition-Docker](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Docker) |
| React Native | [ID-Document-Recognition-React-Native](https://github.com/Faceplugin-ltd/ID-Document-Recognition-React-Native) |
| Flutter | [ID-Document-Recognition-Flutter](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Flutter) |
| Ionic Capacitor | [ID-Document-Recognition-Ionic-Capacitor](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Capacitor) |
| **Ionic Cordova** | **[ID-Document-Recognition-Ionic-Cordova](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova)** (**this repo**) |
| Linux / Docker (Liveness-Only) | [ID-Document-Liveness-Detection-Docker](https://github.com/Faceplugin-ltd/ID-Document-Liveness-Detection-Docker) |


---


## Before you start


| Step | What you need                                                                                                                                                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Node.js 18+**, **npm**, Ionic CLI, Cordova CLI                                                                                                                                                                                                         |
| 2    | **Physical device** recommended (camera; emulator is limited)                                                                                                                                                                                            |
| 3    | Android `documentreadersdk.aar` and iOS `docsdk.framework` — [Get the runtimes](#get-the-runtimes)                                                                                                                                                       |
| 4    | Demo licenses are in `src/license.ts` (Android `com.faceplugin.documentreader`, iOS `com.faceplugin.documentreader.app`, valid until **12 August 2027**). Request a new key only if you change `applicationId` / bundle id — [SDK License](#sdk-license) |


### System requirements


| Item   | Android                                  | iOS                       |
| ------ | ---------------------------------------- | ------------------------- |
| OS     | API 24 min; **API 29 (10)+ recommended** | 13.0 min; 16+ recommended |
| Device | Physical phone with rear camera          | iPhone with A12 or newer  |
| Stack  | Cordova + Ionic React (repo root)        | Same                      |
| Build  | Android Studio / JDK 17                  | Xcode 15+, CocoaPods      |


---


## Get the runtimes

Binaries are gitignored. Copy them **before** your first native build.

### Android — `documentreadersdk.aar`

**Download:** [DocumentReader Android runtime (Google Drive)](https://drive.google.com/drive/folders/1nDSfvj0WtC1lZgzwFd7471ECVtk-nuYH)


| File                    | Path                                                     |
| ----------------------- | -------------------------------------------------------- |
| `documentreadersdk.aar` | `DocumentReaderPlugin/src/android/documentreadersdk.aar` |


### iOS — `docsdk.framework`

**Download:** [DocumentReader iOS runtime (Google Drive)](https://drive.google.com/drive/folders/1do6Ws_BlXGkR_K9jI_ULd1zHjqLGSP4q) — unzip if needed.

Drop (replace) the folder here:

```text
DocumentReaderPlugin/src/ios/Frameworks/docsdk.framework
```

Then run:

```bash
npm run ios
```

That is enough. Cordova hooks **auto-sync** this folder into `platforms/` / `plugins/` on every prepare/build, so you do **not** need to delete platforms, re-add the plugin, or copy frameworks by hand. Framework is **device arm64** only.

### iOS signing (macOS)

Root `build.json` must list your **Team ID** (10 characters). That is the **OU** on your Apple Development certificate — **not** the short id in parentheses after your email in Keychain.

```bash
security find-identity -v -p codesigning
# Certificate subject OU=XXXXXXXXXX  →  use XXXXXXXXXX in build.json
```

```json
{
  "ios": {
    "debug": {
      "developmentTeam": "XXXXXXXXXX",
      "automaticProvisioning": true,
      "codeSignIdentity": "Apple Development",
      "packageType": "development"
    }
  }
}
```

`npm run ios` builds with `build.json`, then installs/launches via `xcrun devicectl` (no `ios-deploy -d`). Plugin hooks write `platforms/ios/cordova/build-extras.xcconfig` and re-sign nested `dcrcore` after build.

Keep **PRODUCT_BUNDLE_IDENTIFIER** / licensed id as `com.faceplugin.documentreader.app` (Android `applicationId` stays `com.faceplugin.documentreader`).

---


## Run the demo


### 0. Install ionic-cordova cli (only when you need)

```bash
npm i -g @ionic/cli cordova
```


### 1. Install

```bash
git clone https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova.git
cd ID-Document-Recognition-Ionic-Cordova
npm install
```


### 2. Place native runtimes

- Android: `DocumentReaderPlugin/src/android/documentreadersdk.aar`
- iOS: `DocumentReaderPlugin/src/ios/Frameworks/docsdk.framework`


### 3. Setup platforms (once)

**Android:**

```bash
npm run setup:android
```

**iOS (macOS only, after placing** `docsdk.framework` **and editing** `build.json`**):**

```bash
npm run setup:ios
```


### 4. Run on device

**Android:**

```bash
npm run android
```

**iOS:**

```bash
npm run ios
# or open platforms/ios/App.xcworkspace in Xcode → Team → physical iPhone → Run
```

> `docsdk.framework` is **device-only (arm64)**. Do not use the simulator for the engine.

Keep iOS bundle id `com.faceplugin.documentreader.app` for the demo license (`config.xml` + hooks).

### 5. Use the demo

1. Wait for the home **status bar** → **Ready**.
2. **Camera** — live rear preview with document locate overlay → **Capture** → on-device OCR, MRZ, barcode, and authenticity checks.
3. **Gallery** — pick front (back optional) → recognize two-sided IDs.
4. **Result** — tabs **Result** / **Security** / **Images** / **Raw JSON** for fields, liveness, crops, and the full JSON response.


| Platform                | Identifier                          |
| ----------------------- | ----------------------------------- |
| Android `applicationId` | `com.faceplugin.documentreader`     |
| iOS bundle id           | `com.faceplugin.documentreader.app` |


### Screenshots


| Home | Camera | Gallery |
| ---- | ------ | ------- |
| ![FacePlugin Document Reader — Home with Camera, Gallery, About](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/home.png) | ![FacePlugin Document Reader — live camera overlay and Capture](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/camera.png) | ![FacePlugin Document Reader — Gallery front and optional back, then Recognize](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/gallery.png) |

| Result | Security | Images |
| ------ | -------- | ------ |
| ![FacePlugin Document Reader — Result tab with OCR, MRZ, and barcode fields](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/result.png) | ![FacePlugin Document Reader — Liveness tab with authenticity and document liveness](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/security.png) | ![FacePlugin Document Reader — Images tab with portrait, signature, and document crops](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/images.png) |

| Raw JSON | About |
| -------- | ----- |
| ![FacePlugin Document Reader — Raw JSON recognize response for integration](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/raw.png) | ![FacePlugin Document Reader — About with on-device Recognition + Liveness license](https://raw.githubusercontent.com/Faceplugin-ltd/faceplugin-assets/main/screenshots/document-reader/mobile/about.png) |


---


## SDK License

Licenses are **offline** and bound to your `applicationId` / bundle identifier.

The sample app already includes a valid key for `com.faceplugin.documentreader` (Android) / `com.faceplugin.documentreader.app` (iOS) (until **12 August 2027**). You only need a new key if you use a different id.

### How to get a license

The code below shows how to use the license:

[https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/license.ts#L11-L20](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/license.ts#L11-L20)

[https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/SdkContext.tsx#L63-L73](https://github.com/Faceplugin-ltd/ID-Document-Recognition-Ionic-Cordova/blob/aec5b6d7ebb66e8ed00a78703057115dcb91533d/src/SdkContext.tsx#L63-L73)

Please [contact us](#contact) to get a license for **your own app**.

### License capabilities (Recognition + Liveness)

After activation, `getLicenseStatus` reports what the key unlocks. Home shows the same summary on the status bar (for example **Ready · Recognition + Liveness**). About shows **License: …**.

| Capability | Meaning |
| ---------- | ------- |
| **Recognition** | OCR, MRZ, barcode/QR, and document type classification |
| **Liveness** (authenticity) | Document authenticity: physical document, security patterns, photo origin, barcode format |

Typical labels:

- **Recognition + Liveness** — full identity verification (Result + Liveness tabs)
- **Recognition** — OCR, MRZ, and barcode only; Security stays empty / not checked
- **Liveness** — authenticity / document liveness only; OCR/MRZ/barcode stays empty / not checked
- **Not licensed** — until you activate

---


## Setup on your own app

You need the `document-reader-cordova` plugin, the native runtimes, and a few lines of TypeScript. You do **not** need the demo pages unless you want the demo UI.

### 1. Add the Cordova plugin

From your Ionic Cordova app (same pattern as the sample repo):

```bash
# copy or submodule DocumentReaderPlugin into your app, then:
ionic cordova plugin add ./DocumentReaderPlugin
```

Or depend on the TypeScript API:

```bash
npm install file:./DocumentReaderPlugin
```

Place `documentreadersdk.aar` at `DocumentReaderPlugin/src/android/documentreadersdk.aar` **before** adding the plugin (Cordova copies it into `libs/` via `resource-file`).

### 2. Enable Kotlin (Android)

In your app `config.xml`:

```xml
<preference name="GradlePluginKotlinEnabled" value="true" />
<preference name="GradlePluginKotlinVersion" value="1.9.24" />
<preference name="AndroidXEnabled" value="true" />
```


### 3. Call the SDK

```ts
import {
  setActivation,
  init,
  recognize,
  normalizeResult,
} from 'document-reader-cordova';

await setActivation({ license: YOUR_LICENSE });
await init();
const json = await recognize(frontPathOrBase64, backOptional);
const result = normalizeResult(json);
```

Live camera locate uses `LocateSession` (see `src/pages/Camera.tsx` in this repo).

---


## About SDK

TypeScript entry: `document-reader-cordova` (`DocumentReaderPlugin/lib`). Cordova service name: `DocumentReaderSdk`.


| API                                   | Purpose                      |
| ------------------------------------- | ---------------------------- |
| `setActivation` / `init` / `deinit`   | License + engine lifecycle   |
| `getLicenseStatus`                    | Recognition / Liveness flags + label |
| `locateDocument` / `recognize`        | Still-image locate / OCR     |
| `documentRecognition` / `documentLiveness` | OCR-only / authenticity-only |
| `LocateSession`                       | Live preview + capture coach |
| `normalizeResult` / `rows` / `images` | Parse raw JSON for UI        |


Full field reference: [https://doc.faceplugin.com](https://doc.faceplugin.com)

---

## Contact

<div align="left">
<a target="_blank" href="mailto:info@faceplugin.com"><img src="https://img.shields.io/badge/email-info@faceplugin.com-blue.svg?logo=gmail" alt="faceplugin.com"></a>&emsp;
<a target="_blank" href="https://t.me/FacePluginSupport"><img src="https://img.shields.io/badge/telegram-@FacePluginSupport-blue.svg?logo=telegram" alt="Telegram @FacePluginSupport"></a>&emsp;
<a target="_blank" href="https://wa.me/+14692784822"><img src="https://img.shields.io/badge/whatsapp-faceplugin-blue.svg?logo=whatsapp" alt="faceplugin.com"></a>
</div>

