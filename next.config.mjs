/** @type {import('next').NextConfig} */
const nextConfig = {
  // 여러 개발 서버를 동시에 띄울 때 빌드 캐시 충돌을 피하기 위한 선택 옵션입니다.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
