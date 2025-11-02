import twilio from 'twilio';
import { env } from '../config/env';
import prisma from '../config/database';
import { generateOtpCode } from '../utils/hash';

// Mock Twilio service for development
const isMockMode = env.NODE_ENV === 'development' || env.TWILIO_SID.startsWith('AC1234');

export class TwilioService {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (!isMockMode) {
      this.client = twilio(env.TWILIO_SID, env.TWILIO_AUTH_TOKEN);
    }
  }

  async sendOtp(phone: string, userId?: string): Promise<string> {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.otpCode.create({
      data: {
        userId,
        phone,
        code,
        expiresAt,
      },
    });

    if (isMockMode) {
      console.log(`📱 [MOCK] OTP for ${phone}: ${code}`);
      return code; // Return code in mock mode for testing
    }

    try {
      await this.client!.messages.create({
        body: `Your ZYNX AI verification code is: ${code}. Valid for 10 minutes.`,
        from: env.TWILIO_PHONE,
        to: phone,
      });

      console.log(`OTP sent to ${phone}`);
      return code;
    } catch (error: any) {
      console.error('Twilio error:', error);
      throw new Error('Failed to send OTP');
    }
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Mark as verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Update user phone verification if userId exists
    if (otpRecord.userId) {
      await prisma.user.update({
        where: { id: otpRecord.userId },
        data: { phoneVerified: true },
      });
    }

    return true;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await prisma.otpCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export default new TwilioService();
