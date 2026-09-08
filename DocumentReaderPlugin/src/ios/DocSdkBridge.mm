#import "DocSdkBridge.h"
#import <TargetConditionals.h>

#if !TARGET_OS_SIMULATOR
#if __has_include(<docsdk/DocSDK.h>)
#import <docsdk/DocSDK.h>
#define DRS_HAS_DOCSDK 1
#elif __has_include("DocSDK.h")
#import "DocSDK.h"
#define DRS_HAS_DOCSDK 1
#endif
#endif

@implementation DocSdkBridge

+ (BOOL)isAvailable {
#ifdef DRS_HAS_DOCSDK
  return YES;
#else
  return NO;
#endif
}

static UIImage *DRSImageFromUriOrBase64(NSString *uriOrBase64) {
  if (uriOrBase64 == nil || uriOrBase64.length == 0) {
    return nil;
  }

  BOOL looksBase64 = [uriOrBase64 hasPrefix:@"data:"] ||
    ([uriOrBase64 length] > 256 &&
     [uriOrBase64 rangeOfString:@"://"].location == NSNotFound &&
     ![uriOrBase64 hasPrefix:@"/"] &&
     ![uriOrBase64 hasPrefix:@"file:"]);

  if (looksBase64) {
    NSString *payload = uriOrBase64;
    NSRange range = [uriOrBase64 rangeOfString:@"base64,"];
    if (range.location != NSNotFound) {
      payload = [uriOrBase64 substringFromIndex:range.location + range.length];
    }
    NSData *data = [[NSData alloc] initWithBase64EncodedString:payload options:NSDataBase64DecodingIgnoreUnknownCharacters];
    if (data == nil) {
      return nil;
    }
    return [UIImage imageWithData:data];
  }

  if ([uriOrBase64 hasPrefix:@"/"] || [uriOrBase64 hasPrefix:@"file:"]) {
    NSString *path = uriOrBase64;
    if ([path hasPrefix:@"file:"]) {
      NSURL *fileURL = [NSURL URLWithString:path];
      path = fileURL.path ?: path;
    }
    UIImage *fromFile = [UIImage imageWithContentsOfFile:path];
    if (fromFile != nil) {
      return fromFile;
    }
  }

  NSURL *url = [NSURL URLWithString:uriOrBase64];
  if (url == nil) {
    return nil;
  }
  NSData *data = [NSData dataWithContentsOfURL:url];
  if (data == nil) {
    return nil;
  }
  return [UIImage imageWithData:data];
}

static UIImage *DRSRedrawAtScale1(UIImage *image, CGSize pixelSize) {
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat defaultFormat];
  format.scale = 1;
  format.opaque = YES;
  UIGraphicsImageRenderer *renderer =
    [[UIGraphicsImageRenderer alloc] initWithSize:pixelSize format:format];
  return [renderer imageWithActions:^(UIGraphicsImageRendererContext * _Nonnull ctx) {
    [image drawInRect:CGRectMake(0, 0, pixelSize.width, pixelSize.height)];
  }];
}

static UIImage *DRSFixOrientation(UIImage *image) {
  if (image == nil) {
    return nil;
  }
  if (image.imageOrientation == UIImageOrientationUp && image.scale == 1.0) {
    return image;
  }
  CGSize pixelSize = CGSizeMake(image.size.width * image.scale, image.size.height * image.scale);
  return DRSRedrawAtScale1(image, pixelSize);
}

static UIImage *DRSUprightCameraImage(UIImage *image) {
  if (image == nil) {
    return nil;
  }
  UIImage *oriented = image;
  CGFloat pw = image.size.width * image.scale;
  CGFloat ph = image.size.height * image.scale;
  if (pw > ph && image.imageOrientation == UIImageOrientationUp) {
    oriented = [UIImage imageWithCGImage:image.CGImage scale:1.0 orientation:UIImageOrientationRight];
  }
  return DRSFixOrientation(oriented);
}

static UIImage *DRSScaledMaxEdge(UIImage *image, CGFloat maxEdge) {
  if (image == nil) {
    return nil;
  }
  CGFloat pw = image.size.width * image.scale;
  CGFloat ph = image.size.height * image.scale;
  CGFloat longest = MAX(pw, ph);
  if (longest <= maxEdge || longest <= 0) {
    return image;
  }
  CGFloat factor = maxEdge / longest;
  CGSize newSize = CGSizeMake(MAX(1.0, pw * factor), MAX(1.0, ph * factor));
  return DRSRedrawAtScale1(image, newSize);
}

static NSString *DRSRescaleLocateJson(
  NSString *json,
  CGFloat locateW,
  CGFloat locateH,
  CGFloat imageW,
  CGFloat imageH
) {
  if (json.length == 0) {
    return json;
  }
  NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];
  id parsed = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  if (![parsed isKindOfClass:[NSDictionary class]]) {
    return json;
  }
  NSMutableDictionary *root = [parsed mutableCopy];
  root[@"_locateImageWidth"] = @(imageW);
  root[@"_locateImageHeight"] = @(imageH);
  id posObj = root[@"position"];
  if (![posObj isKindOfClass:[NSDictionary class]]) {
    NSData *metaOnly = [NSJSONSerialization dataWithJSONObject:root options:0 error:nil];
    return metaOnly ? [[NSString alloc] initWithData:metaOnly encoding:NSUTF8StringEncoding] : json;
  }
  NSMutableDictionary *pos = [posObj mutableCopy];
  CGFloat sx = imageW / MAX(locateW, 1.0);
  CGFloat sy = imageH / MAX(locateH, 1.0);

  id corners = pos[@"corners"];
  if ([corners isKindOfClass:[NSArray class]]) {
    NSMutableArray *scaled = [NSMutableArray arrayWithCapacity:[corners count]];
    for (id item in corners) {
      if (![item isKindOfClass:[NSDictionary class]]) {
        continue;
      }
      NSDictionary *p = item;
      [scaled addObject:@{
        @"x": @([p[@"x"] doubleValue] * sx),
        @"y": @([p[@"y"] doubleValue] * sy),
      }];
    }
    pos[@"corners"] = scaled;
  } else {
    if (pos[@"left"] != nil) pos[@"left"] = @([pos[@"left"] doubleValue] * sx);
    if (pos[@"top"] != nil) pos[@"top"] = @([pos[@"top"] doubleValue] * sy);
    if (pos[@"right"] != nil) pos[@"right"] = @([pos[@"right"] doubleValue] * sx);
    if (pos[@"bottom"] != nil) pos[@"bottom"] = @([pos[@"bottom"] doubleValue] * sy);
  }
  root[@"position"] = pos;
  NSData *out = [NSJSONSerialization dataWithJSONObject:root options:0 error:nil];
  return out ? [[NSString alloc] initWithData:out encoding:NSUTF8StringEncoding] : json;
}

+ (void)writeStatusPayload:(NSDictionary *)payload {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  if (paths.count == 0) {
    return;
  }
  NSString *path = [paths[0] stringByAppendingPathComponent:@"docreader_status.json"];
  NSMutableDictionary *body = [payload mutableCopy] ?: [NSMutableDictionary dictionary];
  body[@"ts"] = @((long long)([[NSDate date] timeIntervalSince1970] * 1000.0));
  NSData *data = [NSJSONSerialization dataWithJSONObject:body options:NSJSONWritingPrettyPrinted error:nil];
  if (data == nil) {
    return;
  }
  [data writeToFile:path atomically:YES];
}

+ (void)writeStatusRaw:(NSString *)json {
  NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];
  id obj = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  if ([obj isKindOfClass:[NSDictionary class]]) {
    [self writeStatusPayload:(NSDictionary *)obj];
  } else {
    [self writeStatusPayload:@{ @"step": @"writeStatus", @"raw": json ?: @"" }];
  }
}

+ (NSString *)getMachineCode {
#ifdef DRS_HAS_DOCSDK
  NSString *mc = [DocSDK getMachineCode] ?: @"";
  [self writeStatusPayload:@{ @"step": @"getMachineCode", @"machine": mc }];
  return mc;
#else
  return @"";
#endif
}

+ (int)setActivation:(NSString *)license {
#ifdef DRS_HAS_DOCSDK
  int code = [DocSDK setActivation:license];
  [self writeStatusPayload:@{
    @"step": @"setActivation",
    @"code": @(code),
    @"licenseError": [DocSDK lastLicenseError] ?: @""
  }];
  return code;
#else
  return 4;
#endif
}

+ (int)initSDK {
#ifdef DRS_HAS_DOCSDK
  int code = [DocSDK initSDK];
  [self writeStatusPayload:@{
    @"step": @"init",
    @"code": @(code),
    @"ready": @(code == 0),
    @"licenseError": [DocSDK lastLicenseError] ?: @""
  }];
  return code;
#else
  return 4;
#endif
}

+ (void)deinitSDK {
#ifdef DRS_HAS_DOCSDK
  [DocSDK deinitSDK];
#endif
}

+ (NSString *)startNewSession:(NSString *)optionsJson {
#ifdef DRS_HAS_DOCSDK
  NSString *json = (optionsJson == nil || optionsJson.length == 0)
    ? [DocSDK startNewSession]
    : [DocSDK startNewSession:optionsJson];
  return json ?: @"";
#else
  return @"";
#endif
}

+ (NSString *)locateDocument:(NSString *)imageUri error:(NSError **)error {
#ifdef DRS_HAS_DOCSDK
  UIImage *image = DRSUprightCameraImage(DRSImageFromUriOrBase64(imageUri));
  if (image == nil) {
    if (error) {
      *error = [NSError errorWithDomain:@"DocumentReaderSdk" code:1 userInfo:@{
        NSLocalizedDescriptionKey: @"Could not decode image"
      }];
    }
    return nil;
  }
  CGFloat imageW = image.size.width * image.scale;
  CGFloat imageH = image.size.height * image.scale;
  UIImage *locateBmp = DRSScaledMaxEdge(image, 480.0);
  CGFloat locateW = locateBmp.size.width * locateBmp.scale;
  CGFloat locateH = locateBmp.size.height * locateBmp.scale;
  NSString *json = [DocSDK locateDocument:locateBmp] ?: @"";
  return DRSRescaleLocateJson(json, locateW, locateH, imageW, imageH);
#else
  if (error) {
    *error = [NSError errorWithDomain:@"DocumentReaderSdk" code:2 userInfo:@{
      NSLocalizedDescriptionKey: @"docsdk.framework not linked"
    }];
  }
  return nil;
#endif
}

+ (NSString *)recognizeFront:(NSString *)frontUri
                         back:(NSString *)backUri
                 authenticity:(BOOL)authenticity
                        error:(NSError **)error {
  return [self recognizeFront:frontUri
                         back:backUri
            authenticityMode:(authenticity ? @"normal" : @"none")
                        error:error];
}

+ (NSString *)recognizeFront:(NSString *)frontUri
                         back:(NSString *)backUri
            authenticityMode:(NSString *)authenticityMode
                        error:(NSError **)error {
#ifdef DRS_HAS_DOCSDK
  UIImage *front = DRSImageFromUriOrBase64(frontUri);
  if (front == nil) {
    if (error) {
      *error = [NSError errorWithDomain:@"DocumentReaderSdk" code:1 userInfo:@{
        NSLocalizedDescriptionKey: @"Could not decode front image"
      }];
    }
    return nil;
  }
  UIImage *back = nil;
  if (backUri != nil && backUri.length > 0) {
    back = DRSImageFromUriOrBase64(backUri);
  }
  [DocSDK startNewSession:@"{\"scenario\":\"FullProcess\",\"series\":false}"];
  NSString *mode = authenticityMode.length ? authenticityMode : @"normal";
  if ([DocSDK respondsToSelector:@selector(recognizeFront:back:authenticityMode:)]) {
    return [DocSDK recognizeFront:front back:back authenticityMode:mode] ?: @"";
  }
  return [DocSDK recognizeFront:front back:back authenticity:![mode.lowercaseString isEqualToString:@"none"]] ?: @"";
#else
  if (error) {
    *error = [NSError errorWithDomain:@"DocumentReaderSdk" code:2 userInfo:@{
      NSLocalizedDescriptionKey: @"docsdk.framework not linked"
    }];
  }
  return nil;
#endif
}

+ (NSString *)processStill:(NSString *)frontUri
                      back:(NSString *)backUri
              livenessOnly:(BOOL)livenessOnly
                     error:(NSError **)error {
#ifdef DRS_HAS_DOCSDK
  UIImage *front = DRSImageFromUriOrBase64(frontUri);
  if (front == nil) {
    if (error) {
      *error = [NSError errorWithDomain:@"DocumentReaderSdk" code:1 userInfo:@{
        NSLocalizedDescriptionKey: @"Could not decode front image"
      }];
    }
    return nil;
  }
  UIImage *back = nil;
  if (backUri != nil && backUri.length > 0) {
    back = DRSImageFromUriOrBase64(backUri);
  }
  [DocSDK startNewSession:@"{\"scenario\":\"FullProcess\",\"series\":false}"];
  if (livenessOnly) {
    if ([DocSDK respondsToSelector:@selector(documentLivenessFront:back:)]) {
      return [DocSDK documentLivenessFront:front back:back] ?: @"";
    }
    return [DocSDK documentAuthenticityFront:front back:back] ?: @"";
  }
  if ([DocSDK respondsToSelector:@selector(documentRecognitionFront:back:)]) {
    return [DocSDK documentRecognitionFront:front back:back] ?: @"";
  }
  return [DocSDK recognizeFront:front back:back authenticityMode:@"none"] ?: @"";
#else
  if (error) {
    *error = [NSError errorWithDomain:@"DocumentReaderSdk" code:2 userInfo:@{
      NSLocalizedDescriptionKey: @"docsdk.framework not linked"
    }];
  }
  return nil;
#endif
}

+ (NSString *)lastLicenseError {
#ifdef DRS_HAS_DOCSDK
  return [DocSDK lastLicenseError] ?: @"";
#else
  return @"";
#endif
}

+ (NSString *)getLicenseStatus {
#ifdef DRS_HAS_DOCSDK
  if ([DocSDK respondsToSelector:@selector(getLicenseStatus)]) {
    return [DocSDK getLicenseStatus] ?: @"{}";
  }
#endif
  return @"{}";
}

@end
