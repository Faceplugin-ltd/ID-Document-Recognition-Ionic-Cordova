#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// Pure DocSDK helpers — no Capacitor imports (safe for Objective-C++).
@interface DocSdkBridge : NSObject

+ (BOOL)isAvailable;
+ (NSString *)getMachineCode;
+ (int)setActivation:(NSString *)license;
+ (int)initSDK;
+ (void)deinitSDK;
+ (NSString *)startNewSession:(nullable NSString *)optionsJson;
+ (nullable NSString *)locateDocument:(NSString *)imageUri error:(NSError * _Nullable * _Nullable)error;
+ (nullable NSString *)recognizeFront:(NSString *)frontUri
                                 back:(nullable NSString *)backUri
                         authenticity:(BOOL)authenticity
                                error:(NSError * _Nullable * _Nullable)error;
+ (nullable NSString *)recognizeFront:(NSString *)frontUri
                                 back:(nullable NSString *)backUri
                    authenticityMode:(NSString *)authenticityMode
                                error:(NSError * _Nullable * _Nullable)error;
+ (nullable NSString *)processStill:(NSString *)frontUri
                               back:(nullable NSString *)backUri
                       livenessOnly:(BOOL)livenessOnly
                              error:(NSError * _Nullable * _Nullable)error;
+ (NSString *)lastLicenseError;
+ (NSString *)getLicenseStatus;
+ (void)writeStatusPayload:(NSDictionary *)payload;
+ (void)writeStatusRaw:(NSString *)json;

@end

NS_ASSUME_NONNULL_END
