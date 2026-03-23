import app from './app.js';
import { ENV } from './config/env.js';

app.listen(ENV.PORT, () => {
  console.log(`🚀 QuickTools API running on http://localhost:${ENV.PORT}`);
  console.log(`   Environment: ${ENV.NODE_ENV}`);
});
