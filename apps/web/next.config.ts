import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Chạy dưới sub-path, vd /happy-attendance (build-time)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Trang tĩnh công khai (không cần đăng nhập): /hdsd, /promo
  async rewrites() {
    return [
      { source: '/hdsd', destination: '/hdsd.html' },
      { source: '/promo', destination: '/promo.html' },
    ];
  },
};

export default nextConfig;
