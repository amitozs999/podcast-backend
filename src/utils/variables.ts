const { env } = process as { env: { [key: string]: string } };

export const { MAILTRAP_USER, MAILTRAP_PASS, VERIFICATION_EMAIL } = env;
