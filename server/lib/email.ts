import nodemailer from 'nodemailer';
import { type User } from '@shared/schema';

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@gameservers.com';
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER || 'user';
const EMAIL_PASS = process.env.EMAIL_PASS || 'password';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// Set up transporter - will use nodemailer if environment vars are set, otherwise use a mock
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendVerificationEmail(user: User, token: string): Promise<boolean> {
  try {
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: user.email,
      subject: 'GameServers - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Welcome to GameServers!</h1>
          <p>Hello ${user.username},</p>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Email</a>
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>Thanks,<br>The GameServers Team</p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendServerApprovalEmail(user: User, serverName: string, isApproved: boolean): Promise<boolean> {
  try {
    const mailOptions = {
      from: EMAIL_FROM,
      to: user.email,
      subject: `GameServers - Server ${isApproved ? 'Approved' : 'Rejected'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">GameServers Update</h1>
          <p>Hello ${user.username},</p>
          ${isApproved 
            ? `<p>Good news! Your server <strong>${serverName}</strong> has been approved and is now listed on GameServers.</p>` 
            : `<p>We're sorry to inform you that your server <strong>${serverName}</strong> has been rejected.</p>
               <p>Please review our server guidelines and ensure your submission follows all our requirements.</p>`
          }
          <a href="${APP_URL}/servers" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">View Servers</a>
          <p>Thanks,<br>The GameServers Team</p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending server approval email:', error);
    return false;
  }
}
