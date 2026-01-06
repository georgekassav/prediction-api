import app from './app';
import { config } from './common/config/config';

app.listen(config.PORT, config.HOST, () => {
  console.log(`Server running on ${config.HOST}:${config.PORT}`);
});
