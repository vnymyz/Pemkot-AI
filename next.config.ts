import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The default dev badge sits at the bottom left, on top of the sidebar profile.
  devIndicators: false,
  // Node-only libraries that build Excel and PowerPoint files on the server.
  serverExternalPackages: ["exceljs", "pptxgenjs", "docx"],
};

export default nextConfig;
