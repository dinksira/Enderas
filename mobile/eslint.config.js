// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: ["dist/**", ".expo/**", "node_modules/**"],
  },
  expoConfig,
  {
    rules: {
      // Animated.Value uses useRef().current during render — standard RN pattern.
      "react-hooks/refs": "off",
    },
  }
]);
