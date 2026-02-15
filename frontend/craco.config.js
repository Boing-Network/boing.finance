const path = require('path');

module.exports = {
  webpack: {
    configure: (config) => {
      // Force a single resolution of @solana/codecs to the full browser bundle
      // so getBytesCodec (from codecs-data-structures) is always available.
      // Fixes: TypeError (0, i.getBytesCodec) is not a function
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@solana/codecs': path.resolve(
          __dirname,
          'node_modules/@solana/codecs/dist/index.browser.mjs'
        ),
      };
      return config;
    },
  },
};
