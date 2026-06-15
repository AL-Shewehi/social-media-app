import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "yietxkapbnjymsgnazzg.supabase.co"
            }
        ]
    }
};

export default nextConfig;
