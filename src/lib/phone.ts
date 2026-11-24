/** `tel:` link for a phone number written for people, such as "+1 415 555 0100". */
export function telHref(phone: string): string {
  // "(0)" marks a trunk prefix, which is not dialled after a country code.
  return `tel:${phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "")}`;
}
