// Example environment file for real Firebase configuration.
// Copy this file to `src/environments/environment.ts` and fill the values.
export const environment = {
  production: false,
  useMock: false,
  firebase: {
    apiKey: 'REPLACE_WITH_YOUR_API_KEY',
    authDomain: 'REPLACE_WITH_YOUR_PROJECT.firebaseapp.com',
    projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
    storageBucket: 'REPLACE_WITH_YOUR_PROJECT.appspot.com',
    messagingSenderId: 'REPLACE_WITH_YOUR_SENDER_ID',
    appId: 'REPLACE_WITH_YOUR_APP_ID'
  }
};
