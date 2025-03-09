// src/utils/notifications.js
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import logger from './logger';

// Configure email transport
let transporter;

// Initialize email transporter based on environment
if (process.env.NODE_ENV === 'production') {
  // Production setup (SMTP)
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development setup (using ethereal.email)
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.DEV_EMAIL_USER || 'ethereal_user',
      pass: process.env.DEV_EMAIL_PASS || 'ethereal_pass'
    }
  });
}

// Email templates directory
const templatesDir = path.join(process.cwd(), 'src', 'templates', 'emails');

/**
 * Send notification email
 * @param {Object} options - Notification options
 * @param {String} options.to - Recipient email address
 * @param {String} options.subject - Email subject
 * @param {String} options.template - Template name (without extension)
 * @param {Object} options.data - Template data
 * @returns {Promise} - Promise that resolves with send info
 */
export const createNotification = async (options) => {
  try {
    const { to, subject, template, data } = options;
    
    // Check if template exists
    const templatePath = path.join(templatesDir, `${template}.html`);
    let htmlContent;
    
    if (fs.existsSync(templatePath)) {
      // Read template file
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      
      // Compile template with Handlebars
      const compiledTemplate = Handlebars.compile(templateSource);
      
      // Generate HTML with data
      htmlContent = compiledTemplate(data);
    } else {
      // Use fallback template if specific template doesn't exist
      const fallbackTemplate = `
        <h1>Notification from Tax Sahi Hai</h1>
        <p>${data.message || 'No message provided'}</p>
      `;
      
      htmlContent = fallbackTemplate;
      logger.warn(`Email template '${template}' not found, using fallback`);
    }
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'notifications@taxsahihai.com',
      to,
      subject,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log email send info
    logger.info(`Email sent: ${info.messageId}`);
    
    return info;
  } catch (error) {
    logger.error('Error sending notification email:', error);
    throw error;
  }
};

export default {
  createNotification
};