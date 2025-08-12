export const environment = {
  isDevelopment: false,
  isProduction: true,
};

export const getPreferenceValues = jest.fn(() => {
  // Pour les tests locaux, priorité aux variables d'environnement avec de vraies valeurs
  // Éviter les valeurs vides qui donneraient des erreurs d'authentification
  const username =
    process.env.INPI_USERNAME && process.env.INPI_USERNAME.trim() ? process.env.INPI_USERNAME.trim() : "test-user";
  const password =
    process.env.INPI_PASSWORD && process.env.INPI_PASSWORD.trim() ? process.env.INPI_PASSWORD.trim() : "test-password";

  return {
    inpiUsername: username,
    inpiPassword: password,
  };
});
