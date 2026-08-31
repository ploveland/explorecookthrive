/**
 * Defense-in-depth CSP. Next.js still needs 'unsafe-inline' for bootstrap
 * scripts and CSS; JSON-LD is application/ld+json and is not executed as JS.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
].join("; ");
