const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Development Fallback: If MAIL_PASS is missing, log to console
    if (!process.env.MAIL_PASS) {
        console.log('--- DEVELOPMENT EMAIL LOG ---');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message);
        if (options.html) console.log('HTML Link:', options.html.match(/href="([^"]*)"/)?.[1] || 'No link found');
        console.log('-----------------------------');
        return { response: 'Development mode: Email logged to console' };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'smarteducation514@gmail.com',
                pass: process.env.MAIL_PASS,
            },
        });

        const mailOptions = {
            from: 'CareSync <smarteducation514@gmail.com>',
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Email could not be sent');
    }
};

module.exports = sendEmail;
