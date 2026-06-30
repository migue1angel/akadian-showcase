import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed/seed.module';
import { SeedService } from 'src/seed/services/seed.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(SeedModule);
    const seedService = app.get(SeedService);
    await seedService.run();
    await app.close();
}

bootstrap();