import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: ["**/node_modules/**", ".next/**", "dist/**"],
  },
  ...nextConfig,
];

export default config;

