export const environment = {
  isDevelopment: false,
  isProduction: true
};

export const getPreferenceValues = jest.fn(() => ({
  inpiUsername: 'test-user',
  inpiPassword: 'test-password'
}));