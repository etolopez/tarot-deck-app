module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Remove expo-router/babel per SDK 50+; keep Reanimated last
    plugins: ["react-native-reanimated/plugin"],
  };
};

