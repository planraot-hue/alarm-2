import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ไม่ต้องสร้าง AGENTS.md / CLAUDE.md อัตโนมัติ
  agentRules: false,
}

export default nextConfig
