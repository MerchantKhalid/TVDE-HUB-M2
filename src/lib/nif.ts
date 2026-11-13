/** Validates a Portuguese NIF (9 digits + modulo-11 check digit). */
export function isValidNif(value: string): boolean {
  if (!/^\d{9}$/.test(value)) return false;
  if (!"1235689".includes(value[0]!)) return false;

  const digits = value.split("").map(Number);
  const sum = digits.slice(0, 8).reduce((acc, digit, index) => acc + digit * (9 - index), 0);
  const remainder = sum % 11;
  const check = remainder < 2 ? 0 : 11 - remainder;
  return check === digits[8];
}
