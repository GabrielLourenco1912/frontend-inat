import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

const envAllowedDevOrigins =
  process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const getLocalDevOrigins = () => {
  try {
    return Object.values(networkInterfaces())
      .flatMap((networkInterface) => networkInterface ?? [])
      .filter(
        (networkInterface) =>
          networkInterface.family === "IPv4" && !networkInterface.internal,
      )
      .map((networkInterface) => networkInterface.address);
  } catch {
    return [];
  }
};

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: [
    ...new Set([...getLocalDevOrigins(), ...envAllowedDevOrigins]),
  ],
};

export default nextConfig;
