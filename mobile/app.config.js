/**
 * Dynamic Expo config layered on top of `app.json`.
 *
 * Expo loads `app.json` first and passes it here as `config`. We only override
 * the pieces that must differ between environments:
 *
 *   - Android `usesCleartextTraffic` is disabled for production builds so
 *     release APKs refuse plaintext HTTP. Development/preview builds keep it
 *     enabled so the app can still reach a LAN backend over HTTP during
 *     local development.
 *
 * The production API base URL is HTTPS (see `eas.json`), so disabling
 * cleartext in production has no functional impact on real traffic.
 */
module.exports = ({ config }) => {
  const isProduction = process.env.EAS_BUILD_PROFILE === 'production';

  const plugins = (config.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-build-properties') {
      const [name, options = {}] = plugin;
      return [
        name,
        {
          ...options,
          android: {
            ...(options.android ?? {}),
            usesCleartextTraffic: !isProduction,
          },
        },
      ];
    }
    return plugin;
  });

  return {
    ...config,
    plugins,
  };
};
