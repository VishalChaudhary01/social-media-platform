export const EMAIL_VERIFICATION_LINK_EXPIRE_TIME = Date.now() + 1000 * 60 * 60; // 1 hour
export const PASSWORD_RESET_EXPIRY_TIME = Date.now() + 1000 * 60 * 15; // 15 minutes
export const EMAIL_VERIFICATION_LINK_RESENT_TIME = Date.now() + 1000 * 30; // 30 sec
export const EMAIL_VERIFICATION_COOKIE_EXPIRE_TIME =
  Date.now() + 1000 * 60 * 60;

export const AUTH_COOKIE_NAME = 'social-midia-auth-token';
export const PENDING_EMAIL_VERIFICATION_USER_ID =
  'pending_email_verification_user_id';
