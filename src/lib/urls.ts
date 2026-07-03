export function publicBaseUrl() {
  return (
    process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://network.vexory.xyz"
  );
}
