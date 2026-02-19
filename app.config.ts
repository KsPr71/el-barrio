// Load environment variables with proper priority (system > .env)
import type { ExpoConfig } from "expo/config";
import "./scripts/load-env.js";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
// Bundle ID can only contain letters, numbers, and dots
// Android requires each dot-separated segment to start with a letter
const rawBundleId = "space.kspr.app.por.el.barrio.t20260215170444";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".") // Replace hyphens/underscores with dots
    .replace(/[^a-zA-Z0-9.]/g, "") // Remove invalid chars
    .replace(/\.+/g, ".") // Collapse consecutive dots
    .replace(/^\.+|\.+$/g, "") // Trim leading/trailing dots
    .toLowerCase()
    .split(".")
    .map((segment) => {
      // Android requires each segment to start with a letter
      // Prefix with 'x' if segment starts with a digit
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.kspr.app";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `kspr${timestamp}`;

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Por el Barrio",
  appSlug: "{{project_name}}",
  // Supabase (también en .env como EXPO_PUBLIC_SUPABASE_*)
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    "https://djxvosobflwtryenqoou.supabase.co",
  supabaseKey:
    process.env.EXPO_PUBLIC_SUPABASE_KEY ??
    "sb_publishable_gDj3b0TEsq90hW2D_aJQhg_XX9LDw3I",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl:
    "https://private-us-east-1.manuscdn.com/sessionFile/oexCGYOGkHraOBw8hcc91O/sandbox/znGK6xciT7vhePk7SRHjae-img-1_1771194669000_na1fn_cG9yLWVsLWJhcnJpby1sb2dv.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvb2V4Q0dZT0drSHJhT0J3OGhjYzkxTy9zYW5kYm94L3puR0s2eGNpVDd2aGVQazdTUkhqYWUtaW1nLTFfMTc3MTE5NDY2OTAwMF9uYTFmbl9jRzl5TFdWc0xXSmhjbkpwYnkxc2IyZHYucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=BUXVbKOjWecaNPiooFSqycvDJ488WVtvtKaiLXCcdjDtcAGim8Xa8iu00d1ATLiqdnikKd~bPHfgMmS6FwH6fFEK3QXriowGGGadBITfIbg6EuDepFj53hglmxCUgC3IJXXrYdHstJcGTp5n85M3eFBqiYJeXSZvGuNv8y9GWAeITLkn~p5~cYit19hKl8tZTJgCwxFT5lICC9sOogDTioMeAxXx4TA59l1~Hz-UzmgvVM2LgDwMWqCKbDn5DkX6F-qcyiUjkTNF2KnVtH9fGVjWf~kItEH3H9BiLIs~ub-B0FcRxdWskUU2UG~nsCE8jVHy1XtbpWr-IGnBtEz~2A__",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: "por-el-barrio",
  version: "1.2.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    // Google Maps (react-native-maps) – opcional; si no se usa, iOS usará Apple Maps
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    // Google Maps (react-native-maps) – usa EXPO_PUBLIC_GOOGLE_MAPS_API_KEY en .env
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    supabaseUrl: env.supabaseUrl,
    supabaseKey: env.supabaseKey,
    eas: {
      projectId: "bc941bc0-5add-4c40-a3fe-73c9c8bc8866",
    },
  },

  owner: "kind-dev",
};

export default config;
