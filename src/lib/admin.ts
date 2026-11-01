/**
 * The app has a single admin, recognised by the login (auth) e-mail. Always
 * compare against the auth user's e-mail (requireAuth/getUser), never against
 * profiles.email.
 */
export const ADMIN_EMAIL = "christoph.menke@gmail.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}
