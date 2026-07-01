// Babel config for Expo — Reanimated plugin must be listed last
module.exports = function (api) {
  // Cache babel config for faster rebuilds
  api.cache(true);
  // Return preset and plugins used by Metro bundler
  return {
    // Expo's default preset handles TypeScript and JSX
    presets: ['babel-preset-expo'],
    // Reanimated plugin must be the final plugin in the array
    plugins: ['react-native-reanimated/plugin'],
  };
};
