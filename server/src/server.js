require('dotenv').config();
const app = require('./app');
const { verifyEmailConnection } = require('./utils/email.util');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  // Verify email in background so it doesn't block server startup
  verifyEmailConnection().catch(err => console.error('[Email] Connection failed:', err.message));
});
