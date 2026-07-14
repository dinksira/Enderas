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
      // Reanimated v3 SharedValues are mutated via `.value = ...` from
      // inside effects, callbacks, and event handlers — that's the
      // documented pattern and the rule fires false positives on every
      // legitimate worklet driver.
      "react-hooks/immutability": "off",
      // Reanimated carousel `onSnapToItem` synchronously calls setState
      // to mirror the active index for the counter badge + thumbnail
      // strip. The render is bounded and intentional — turning the rule
      // off avoids noise on what is actually a tight, performant path.
      "react-hooks/set-state-in-effect": "off",
    },
  }
]);
