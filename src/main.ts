import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 👇 Add this to connect the RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672',
      ],
      queue: 'main_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices(); // 👈 Important: actually starts the queue listener

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Delivery API')
      .setDescription('Logistics and delivery management backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://192.168.100.5:3000'],
    credentials: true,
  });

  // Serve static files from the uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap()
  .then(() => {
    console.log(`🚀 Application running on port ${process.env.PORT || 3000}`);
  })
  .catch((err) => {
    console.error('❌ Application failed to start', err);
    process.exit(1);
  });
