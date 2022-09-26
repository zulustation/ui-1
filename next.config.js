const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  experimental: {
    scrollRestoration: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        pako: false,
        ...config.resolve.fallback,
      };
    }

    config.externals = [
      ...config.externals,
      {
        //"@substrate/connect": "SubstrateConnect",
        "@substrate/smoldot-light": "SmoldotLightClient",
      },
    ];

    return config;
  },
});