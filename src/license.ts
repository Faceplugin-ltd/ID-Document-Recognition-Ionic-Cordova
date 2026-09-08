/**
 * Demo FP1 licenses — same keys as native DocumentReader Android / iOS Apps.
 * Bound to applicationId / bundle id below. Request a new key if you change the id.
 *
 * iOS must run as com.faceplugin.documentreader.app (see config.xml ios-CFBundleIdentifier).
 * Android must run as com.faceplugin.documentreader.
 */
import { getCordovaPlatform } from 'document-reader-cordova';

/** Android demo applicationId (config.xml android-packageName / widget id) */
export const ANDROID_APPLICATION_ID = 'com.faceplugin.documentreader';

/** iOS demo bundle id (config.xml ios-CFBundleIdentifier) */
export const IOS_BUNDLE_ID = 'com.faceplugin.documentreader.app';

const ANDROID_LICENSE =
  'FP1.RlBMMQMAAQBQSIzAH2eN//dhmogUAgAA6it+v6FwsHy6veTJ2SpbdcUeEFeScwYIvZFAxdshTBNX3WQ7spvIdrHTDhmR7GxPOLsZM9vt5ByR7Bu4zWCSqDHob0Gbs3sNiO9NJbbD0CsGJAG299rEbFhXdj+5T1C3JikrCW7Az4OUwDOsI//csXtdyIuylFgabEO/IvrvSIsgcN0CVM4vGc7IkA73buAbVkhZTjJCiOh2mfYuAarGjjvr/AHvDm2F18aFPG0yBV978G9lMmmrYwqqikgeSWngzDWkxkcKfT6wiWz2i+ZcLT/8cAigtEb/f8tMWdvd+6CY8jc4fDqwInhgxtgU++G1PfoIsrSbmQrE8moz6EicBb7ertFhKpKfTQHuGlv4t2T67WejDxb8CJz6lRk+yrVWsjDP3PcQ2085PmYAqTWChqEJhsopHMymlwgwY5wsk684XebyR2WTUorjAfaO4vOwABZz9TFViDXRWh2Ee9ixi0Co1cBS5OzVBQRX5rYd8qrSeeUDrz4Dmc4QHNO77uuVETe+tAc1qEByaFbBawBfYljt/WK3M7oFUTQEkcHJQCphqiy9od1C+s3LuR5v3J2SEk/vO0MqeP41QZMvqFe6yS1AABI6I2hMjwjIHc5roICxbhQIpmeM5ABTuSwOjC2Bt6vGj1b6k9dh01Eh3YKdJhz5E8162LbSB/k7b4AtEDNVUHazhVhyxUVWrPhi6JDNjRAxHIsAMIGIAkIBweneBNUFcscRvbfJlmg5vTC34oSC0Drpz9emKRPXgIuD/CTV+zSVFtNdGOGoF+GzN7xdGirXIti76t/w/5mRb+ACQgEes18sAPPkZqhIvb2VjqQ3gvn27TLHB/kUFwYo4J+nGbmZhlNDvHhKDMMEAbeZM6PBWRR5yRU0a0pU4+CJkYl1pA==';

const IOS_LICENSE =
  'FP1.RlBMMQMAAQAZ9Zwi8fHG33dpwB8MAgAAugTVCCTnRx8neRXi7q3IQx09+pM/07ZLOE3uhGCXIfQq/jt8i6+oovCghJsTnzx+LbraSzYnYKhFM+8ZpCt5x6/YNgVNh2Wrdq336ehT9ZmWagxWEm/T4sJw0IlrJwxz+uDS01X95P0og2hQy61Rqh6Q2lCsRpBVj6tVpVU7Q4BcnL43JHUZyFIFzZVhgakFrzZ1v2yMX7hZubx1vsVTDS8XZjOEjNyIs2B7th1XczBQV9jRo/Hzq9IFypKxF+w0kqKeiCGgXtEkpVnhH0q2d3Ol3Hwd7VCvN4rwAfXA4LRpBqMMXgN0iFb4GaZ/5RrcuiWGHt6Se1XRdLaVcYeiafY9i0dGnKpWoYC6Wcc3w7Ud9tt/JH3ZCW0VSX3mhbwizb9aUFpfewQ1233B2QkyydYrmcW9WdRyuIITCZl7lxL4Bu+rMuNvYImrbjnPtUMErhwldzp5/KpVD2n8ZuhQVqo/nvxKVkhu49jA5rncA99rBR/j8PA8tQnrkJA/UzbnGZKe5vaUZHHbc2f/8hoyFAd+bYsgWBBGm98d/JoFNeKA/Lj9qBz/96Vhsb31X/g69Mg2FjeKLmPNLRBsdtB5Gq451Ng7SqVBhSLu3izjcEPw0ZNvfgp41+RXMoxr3HrJ0Nrxe+DjbsVVEhXboNK5UoW0K+YwDpRBssLUBD2v0A5O46pNVDj8BjG6P26LADCBiAJCAUUBMF7fdBJVN4bynNDBBmW66ebB8UiHQWqr3JXWGS4yX+ANEOKFA8x241i0loqcmVGGkNRTdDEuE8T4WaDU9WqBAkIAsgWLPid1PUQVJZVceswxeHuK+NkbA4temoT2sYADekl3tZEA2YA4Ax8Z02A3xY1cT7gAnQz6fMxwoRmYKzZevDQ=';

/** Resolve Cordova platform; fall back to UA when platformId is not ready yet. */
export function resolveNativePlatform(): 'ios' | 'android' | 'web' {
  const p = getCordovaPlatform();
  if (p === 'ios' || p === 'android') return p;
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
  }
  return 'web';
}

export function demoLicense(): string {
  const platform = resolveNativePlatform();
  const license = platform === 'ios' ? IOS_LICENSE : ANDROID_LICENSE;
  console.log(
    `[DocumentReader] license platform=${platform} boundId=${
      platform === 'ios' ? IOS_BUNDLE_ID : ANDROID_APPLICATION_ID
    } keyPrefix=${license.slice(0, 24)}…`
  );
  return license;
}
