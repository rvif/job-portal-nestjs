import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailModule } from 'src/mail/mail.module';
import { EmailProcessor } from './email.processor';

@Global()
@Module({
  imports: [
    MailModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const ENV = configService.getOrThrow<string>('ENV');
        if (ENV === 'PROD') {
          return {
            connection: {
              url: configService.getOrThrow<string>('UPSTASH_REDIS_URL'),
              tls: {},
            },
          };
        } else {
          return {
            connection: {
              host: configService.getOrThrow<string>('REDIS_HOST'),
              port: parseInt(
                configService.getOrThrow<string>('REDIS_PORT'),
                10,
              ),
              password: configService.getOrThrow<string>('REDIS_PASSWORD'),
            },
          };
        }
      },
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [EmailProcessor],
  exports: [BullModule],
})
export class BullMqModule {}
