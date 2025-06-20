import 'dotenv/config';

export default {
  "expo": {
    "name": "WHMate",
    "slug": "WHMate",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "whmate",
    "userInterfaceStyle": "automatic",
    "assetBundlePatterns": ["**/*"],
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sarahinaus.whmate",
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_IOS_API_KEY
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.sarahinaus.whmate",
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
