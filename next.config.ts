import type { NextConfig } from "next"

// Evita o warning de baseline-browser-mapping/browserslist sobre dados “antigos”
process.env.BROWSERSLIST_IGNORE_OLD_DATA = process.env.BROWSERSLIST_IGNORE_OLD_DATA || "true"
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA =
  process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA || "true"

const nextConfig: NextConfig = {
  /* config options here */
}

export default nextConfig
