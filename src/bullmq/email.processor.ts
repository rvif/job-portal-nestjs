import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/mail/mail.service';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'send-email': {
        const { to, subject, body } = job.data;
        console.log(`Processing background email to (${to}).`);

        await this.mailService.sendEmail(to, subject, body);

        console.log(`Email sent succesfully to (${to}).`);

        return;
      }

      default: {
        throw new Error(`Unknown job name: ${job.name}`);
      }
    }
  }
}
