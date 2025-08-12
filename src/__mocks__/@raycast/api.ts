export const environment = {
  isDevelopment: false,
  isProduction: true,
};

export const getPreferenceValues = jest.fn(() => {
  // For local tests, prioritize environment variables with real values
  // Avoid empty values that would cause authentication errors
  const username =
    process.env.INPI_USERNAME && process.env.INPI_USERNAME.trim() ? process.env.INPI_USERNAME.trim() : "test-user";
  const password =
    process.env.INPI_PASSWORD && process.env.INPI_PASSWORD.trim() ? process.env.INPI_PASSWORD.trim() : "test-password";

  return {
    inpiUsername: username,
    inpiPassword: password,
  };
});
