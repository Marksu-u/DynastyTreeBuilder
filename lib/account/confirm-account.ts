/**
 * The delete-account confirmation is armed only when the typed value matches
 * the account email, ignoring surrounding whitespace and case. An empty or
 * whitespace-only input never confirms, even if the email itself is empty.
 */
export function isDeletionConfirmed(input: string, email: string): boolean {
  const normalize = (v: string) => v.trim().toLowerCase();
  const typed = normalize(input);
  return typed.length > 0 && typed === normalize(email);
}
