import "ldapjs";

declare module "ldapjs" {
  interface SearchEntry {
    object: Record<string, unknown>;
  }
}