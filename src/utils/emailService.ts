import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // Must be false for port 587 (STARTTLS)
  requireTLS: true, // Office 365 requires TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

export const sendEmailToFounders = async (contactDetails: { name: string, email: string, phone: string, phoneCode: string, projectType: string, message: string }) => {
  const { name, email, phone, phoneCode, projectType, message } = contactDetails;
  
  const foundersEmails = [
    process.env.FOUNDER1_EMAIL,
    process.env.FOUNDER2_EMAIL,
    process.env.FOUNDER3_EMAIL,
  ].filter(Boolean) as string[];

  if (foundersEmails.length === 0) {
    console.error("No founder emails configured.");
    return;
  }

  const mailOptions = {
    from: `"Nexus Contact" <${process.env.SMTP_USER}>`,
    to: foundersEmails.join(","),
    subject: `New Contact Inquiry from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">New Contact Query Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> +${phoneCode.replace(/^\+/, "")} ${phone}</p>
        <p><strong>Project Type:</strong> ${projectType}</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px;">
          <h4 style="margin-top: 0; color: #555;">Message:</h4>
          <p style="white-space: pre-wrap; color: #444;">${message}</p>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">This is an automated notification from your website.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email to founders:", error);
  }
};

export const sendThankYouEmail = async (userEmail: string, userName: string) => {
  const mailOptions = {
    from: `"Nexus Team" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Thank you for contacting us, ${userName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #007bff;">Thank You for Reaching Out!</h2>
        <p>Hi ${userName},</p>
        <p>We have successfully received your inquiry. Our team is currently reviewing your request and will get back to you as soon as possible.</p>
        <p>If you have any urgent questions, feel free to reply directly to this email.</p>
        <br/>
        <p>Best regards,</p>
        <p><strong>The Nexus Team</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending thank you email:", error);
  }
};

export const sendReplyEmail = async (email: string, subject: string, message: string) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: subject,
    html: message, // using html to support rich text, as hinted in snippet
  };

  await transporter.sendMail(mailOptions);
};
