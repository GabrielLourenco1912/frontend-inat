export function safeReturnTo(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/sistema";
  }
  return value.startsWith("/sistema") ? value : "/sistema";
}
