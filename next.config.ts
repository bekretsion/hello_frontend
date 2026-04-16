import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  webpack: (config, { dev }) => {
    config.resolve.symlinks = false;

    // Fix file watcher triggering on native file picker dialogs
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 2000, // Use polling instead of native file watchers (less frequent)
        aggregateTimeout: 1000, // Wait longer before rebuilding
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/public/**',
          '**/*.log',
          '**/tmp/**',
          '**/temp/**',
        ],
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Removed rewrites - using manual API route proxying instead
};

export default withNextIntl(nextConfig as any);
