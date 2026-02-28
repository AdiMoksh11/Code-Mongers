// const sgMail = require('@sendgrid/mail');

// if (!process.env.SENDGRID_API_KEY) {
//   console.warn('⚠️  SENDGRID_API_KEY not found. Email functionality will not work.');
// } else {
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//   console.log('✅ SendGrid configured successfully');
// }

// const sendEmail = async (to, text, subject = "Credexa Notification", html = null) => {
//   if (!to || !text) {
//     throw new Error('Email recipient and content are required');
//   }

//   if (!process.env.SENDGRID_API_KEY) {
//     throw new Error('SendGrid API key not configured');
//   }

//   const msg = {
//     to,
//     from: {
//       email: process.env.SENDGRID_FROM_EMAIL || 'credexaowns@gmail.com',
//       name: 'Credexa'
//     },
//     subject,
//     text,
//     html: html || `<p>${text.replace(/\n/g, '<br>')}</p>`,
//   };

//   try {
//     await sgMail.send(msg);
//     console.log(`✅ Email sent to ${to} via SendGrid`);
//   } catch (error) {
//     console.error('❌ SendGrid error:', error.response?.body || error);
//     throw new Error(`Email sending failed: ${error.message}`);
//   }
// };

// module.exports = sendEmail;
