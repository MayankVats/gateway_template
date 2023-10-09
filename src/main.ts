import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService).get();

  app.enableCors();

  await app.listen(config.PORT, () => {
    console.log('ENVIRONMENT LOADED: ', config);
    console.log('Server running at PORT ->', config.PORT);
  });
}
bootstrap();
