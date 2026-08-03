/** @type {import('next').NextConfig} */
const nextConfig = {
  // Previously both of these were `true`, which hid 10 type errors and every
  // lint warning. The codebase now typechecks clean, so failures surface here.
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
