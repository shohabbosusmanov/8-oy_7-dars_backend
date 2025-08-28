import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: +this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendResetPasswordEmail(to: string, link: string) {
    const html = `
  <div style="font-family: sans-serif; padding: 20px;">
    <p>Click the button below to reset your password:</p>
    <a href="${link}" 
       style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;" 
       target="_blank">
      Reset Password
    </a>
    <p>If the button doesn't work, copy and paste the following link into your browser:</p>
    <p>${link}</p>
  </div>
`;

    try {
      await this.transporter.sendMail({
        from: `"Your App" <${this.configService.get('SMTP_USER')}>`,
        to,
        subject: 'Reset your password',
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
