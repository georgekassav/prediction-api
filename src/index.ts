import app from './app';
import { config } from './common/config/config';

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
