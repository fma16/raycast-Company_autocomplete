export const environment = {
  isDevelopment: false,
  isProduction: true,
};

export const getPreferenceValues = jest.fn(() => {
  // Si les variables d'environnement sont définies (même vides), les utiliser
  // Sinon, utiliser les valeurs de test par défaut
  const username = process.env.hasOwnProperty('INPI_USERNAME') ? process.env.INPI_USERNAME : "test-user";
  const password = process.env.hasOwnProperty('INPI_PASSWORD') ? process.env.INPI_PASSWORD : "test-password";
  
  return {
    inpiUsername: username,
    inpiPassword: password,
  };
});
