require('dotenv').config();
const app = require('./app');
const { verifyEmailConnection } = require('./utils/email.util');

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`[Server] Running on port ${PORT}`);
  await verifyEmailConnection(); // Check SMTP on startup
});
