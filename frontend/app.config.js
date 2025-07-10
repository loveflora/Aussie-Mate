import 'dotenv/config';

export default {
  "expo": {
    "name": "AussieMate",
    "slug": "aussiemate",
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "aussiemate",
    "userInterfaceStyle": "automatic",
    "assetBundlePatterns": ["**/*"],
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "extra": {
      "eas": {
        "projectId": "3c348dbb-1fbd-424e-b5a3-624692c34542"
      },
      "apiUrl": "http://10.0.2.2:5000/api" // Android Emulator 용
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sarahinaus.aussiemate",
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_IOS_API_KEY
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.sarahinaus.aussiemate",
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_ANDROID_API_KEY
        }
      }
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "This app uses your location to display your current position on the map and to identify nearby WHV 417/491 visa-eligible areas."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "tsconfigPaths": true
    },
    "entryPoint": "./node_modules/expo-router/entry.js"
  }
};
