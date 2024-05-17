export const isValidPassword = async (
  password: string,
  hashedPassword: string,
) => {
  return hashedPassword === (await hashPassword(password));
};

const hashPassword = async (password: string) => {
  const arrayBuffer = await crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(password),
  );
  return Buffer.from(arrayBuffer).toString("base64");
};
