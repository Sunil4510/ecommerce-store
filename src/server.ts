import app from './app.js';
import { config } from './config.js';

app.listen(config.PORT, () => {
  console.log(`[E-Commerce API] Server successfully started on port ${config.PORT}`);
  console.log(`[E-Commerce API] Admin secret token is configured.`);
});
