const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PlotSure Connect <noreply@plotsureconnect.rw>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  // Welcome email for new brokers
  welcomeBroker: (name) => ({
    subject: 'Welcome to PlotSure Connect!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; color: #666; }
          .btn { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏞️ PlotSure Connect</h1>
            <h2>Welcome Aboard!</h2>
          </div>
          <div class="content">
            <h3>Hello ${name},</h3>
            <p>Welcome to PlotSure Connect! We're excited to have you join our mission to combat land fraud and improve transparency in land transactions across Bugesera.</p>
            <p>As a verified broker on our platform, you now have access to:</p>
            <ul>
              <li>✅ Create and manage verified land listings</li>
              <li>✅ Upload documents and media for transparency</li>
              <li>✅ Manage customer inquiries and reservations</li>
              <li>✅ Track your listing performance</li>
            </ul>
            <p>Your account is now active and ready to use!</p>
            <a href="${process.env.FRONTEND_URL}/broker/dashboard" class="btn">Access Dashboard</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The PlotSure Connect Team</p>
            <p>📧 support@plotsureconnect.rw | 📞 +250 788 XXX XXX</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to PlotSure Connect, ${name}! Your broker account is now active.`
  }),

  // New inquiry notification
  newInquiry: (brokerName, inquirerName, listingTitle, inquiryMessage) => ({
    subject: `New Inquiry for "${listingTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .inquiry-box { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; color: #666; }
          .btn { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏞️ PlotSure Connect</h1>
            <h2>New Inquiry Received!</h2>
          </div>
          <div class="content">
            <h3>Hello ${brokerName},</h3>
            <p>You have received a new inquiry for your listing: <strong>"${listingTitle}"</strong></p>
            
            <div class="inquiry-box">
              <h4>Inquiry Details:</h4>
              <p><strong>From:</strong> ${inquirerName}</p>
              <p><strong>Message:</strong></p>
              <p style="font-style: italic;">"${inquiryMessage}"</p>
            </div>
            
            <p>Please respond promptly to maintain customer satisfaction and trust.</p>
            <a href="${process.env.FRONTEND_URL}/broker/inquiries" class="btn">View Inquiry</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The PlotSure Connect Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `New inquiry from ${inquirerName} for "${listingTitle}": ${inquiryMessage}`
  }),

  // Inquiry confirmation to customer
  inquiryConfirmation: (customerName, listingTitle) => ({
    subject: 'Inquiry Confirmation - PlotSure Connect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏞️ PlotSure Connect</h1>
            <h2>Inquiry Received!</h2>
          </div>
          <div class="content">
            <h3>Hello ${customerName},</h3>
            <p>Thank you for your inquiry about <strong>"${listingTitle}"</strong>.</p>
            <p>We have received your message and forwarded it to our verified broker. You can expect a response within 24 hours.</p>
            <p>Our brokers are committed to providing you with accurate information and transparent documentation for all land listings.</p>
            <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The PlotSure Connect Team</p>
            <p>📧 support@plotsureconnect.rw | 📞 +250 788 XXX XXX</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Thank you for your inquiry about "${listingTitle}". We'll respond within 24 hours.`
  }),

  // Contact form confirmation
  contactConfirmation: (name, subject) => ({
    subject: 'Contact Form Confirmation - PlotSure Connect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏞️ PlotSure Connect</h1>
            <h2>Message Received!</h2>
          </div>
          <div class="content">
            <h3>Hello ${name},</h3>
            <p>Thank you for contacting PlotSure Connect regarding: <strong>"${subject}"</strong></p>
            <p>We have received your message and our team will review it carefully. You can expect a response within 24-48 hours.</p>
            <p>We appreciate your interest in our platform and look forward to assisting you.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The PlotSure Connect Team</p>
            <p>📧 support@plotsureconnect.rw | 📞 +250 788 XXX XXX</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Thank you for contacting us about "${subject}". We'll respond within 24-48 hours.`
  }),

  // Listing verification notification
  listingVerified: (brokerName, listingTitle) => ({
    subject: `Listing Verified: "${listingTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; color: #666; }
          .btn { background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Listing Verified!</h1>
          </div>
          <div class="content">
            <h3>Hello ${brokerName},</h3>
            <p>Great news! Your listing <strong>"${listingTitle}"</strong> has been successfully verified and is now live on PlotSure Connect.</p>
            <p>Your listing now features:</p>
            <ul>
              <li>✅ Verified badge for increased trust</li>
              <li>✅ Higher visibility in search results</li>
              <li>✅ Access to all platform features</li>
            </ul>
            <p>Customers can now view your verified listing and submit inquiries.</p>
            <a href="${process.env.FRONTEND_URL}/broker/listings" class="btn">View Your Listings</a>
          </div>
          <div class="footer">
            <p>Best regards,<br>The PlotSure Connect Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Your listing "${listingTitle}" has been verified and is now live!`
  })
};

// Specific email sending functions
exports.sendWelcomeEmail = async (email, name) => {
  const template = emailTemplates.welcomeBroker(name);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

exports.sendInquiryNotification = async (brokerEmail, brokerName, inquirerName, listingTitle, inquiryMessage) => {
  const template = emailTemplates.newInquiry(brokerName, inquirerName, listingTitle, inquiryMessage);
  return await sendEmail({
    to: brokerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

exports.sendInquiryConfirmation = async (customerEmail, customerName, listingTitle) => {
  const template = emailTemplates.inquiryConfirmation(customerName, listingTitle);
  return await sendEmail({
    to: customerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

exports.sendContactConfirmation = async (email, name, subject) => {
  const template = emailTemplates.contactConfirmation(name, subject);
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

exports.sendListingVerificationEmail = async (brokerEmail, brokerName, listingTitle) => {
  const template = emailTemplates.listingVerified(brokerName, listingTitle);
  return await sendEmail({
    to: brokerEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// Generic email sending function
exports.sendEmail = sendEmail;

// Test email connection
exports.testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
};