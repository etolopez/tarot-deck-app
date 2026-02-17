// Metro bundler configuration for React Native/Expo
// This config ensures backend code is excluded from the frontend bundle

const { getDefaultConfig } = require('expo/metro-config');

/**
 * Get the default Metro configuration for Expo
 * This includes standard React Native and Expo settings
 */
const config = getDefaultConfig(__dirname);

/**
 * Configure Metro to exclude backend directory and its dependencies
 * This prevents Node.js-only packages (like dotenv) from being bundled
 * into the React Native app, which doesn't support Node.js standard library
 */
config.resolver = {
  ...config.resolver,
  // Block list prevents Metro from resolving these paths
  // Using RegExp to match backend directory and all its contents
  blockList: [
    // Exclude the entire backend directory and all its contents
    // This pattern matches any path containing /backend/ or \backend\
    /.*[\/\\]backend[\/\\].*/,
  ],
  // Additional resolver configuration
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx', 'json'],
};

/**
 * Watch folders configuration
 * Only watch the frontend source directories, exclude backend
 */
config.watchFolders = [
  // Only watch the project root, Metro will automatically exclude backend
  // based on blockList configuration
  __dirname,
];

/**
 * Resolver configuration for assets
 * Allow Metro to resolve images from Cards-jpg folder
 */
config.resolver.assetExts = [
  ...(config.resolver?.assetExts || []),
  'jpg',
  'jpeg',
  'png',
];

/**
 * Transformer configuration
 * Ensures proper handling of TypeScript and modern JavaScript
 */
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better performance
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;

