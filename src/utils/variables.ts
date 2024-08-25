const { env } = process as { env: { [key: string]: string } };

export const {
  MAILTRAP_USER,
  MAILTRAP_PASS,
  VERIFICATION_EMAIL,
  SIGN_IN_URL,
  PASSWORD_RESET_LINK,
  JWT_SECRET,
  CLOUD_KEY,
  CLOUD_NAME,
  CLOUD_SECRET,
} = env;
