const DAY_MS = 86_400_000;

/**
 * Builds a security.txt file (RFC 9116). The contact is the security mailbox
 * when one is configured, and the contact page otherwise, so the file is
 * always valid. It expires just under a year after the build, as the RFC
 * recommends; rebuilding the site renews it.
 */
export function buildSecurityTxt(input: {
  url: string;
  securityEmail?: string;
  builtAt: number;
}): string {
  const contact = input.securityEmail ? `mailto:${input.securityEmail}` : `${input.url}/contact`;
  const expires = new Date(input.builtAt + 364 * DAY_MS);
  expires.setUTCHours(0, 0, 0, 0);

  return [
    `Contact: ${contact}`,
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en",
    `Canonical: ${input.url}/.well-known/security.txt`,
    `Policy: ${input.url}/security#disclosure`,
    "",
  ].join("\n");
}
