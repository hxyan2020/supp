import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img02.mockplus.cn" },
      { protocol: "https", hostname: "assets.mockplus.cn" },
    ],
  },
};

export default withNextIntl(nextConfig);
