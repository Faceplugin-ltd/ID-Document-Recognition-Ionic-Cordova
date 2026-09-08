# iOS frameworks

## What to do (beginners)

1. Download **docsdk.framework.zip** from Google Drive (see repo README → **Get the runtimes**).
2. Unzip and place the folder here as:

```text
DocumentReaderPlugin/src/ios/Frameworks/docsdk.framework
```

3. From the app root run:

```bash
npm run ios
```

Hooks sync this folder into Cordova `platforms/` / `plugins/` automatically before each iOS build. You do not need to remove platforms or re-add the plugin after updating the Drive runtime.

The framework is **device arm64 only** (no simulator).
