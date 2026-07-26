const SIGNIFICANT_DIGITS = 9;

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Compares phone numbers by their trailing digits rather than requiring an
 * exact match. Contacts in this CRM are often saved in local French format
 * (06 12 34 56 78) while Whapi delivers international format
 * (+33612345678) — an exact-string comparison would silently fail to link
 * them.
 */
export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na.slice(-SIGNIFICANT_DIGITS) === nb.slice(-SIGNIFICANT_DIGITS);
}
