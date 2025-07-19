const puppeteer = require('puppeteer');
const {
  S3Client,
  PutObjectCommand
} = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Setup S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const bucketName = process.env.S3_BUCKET;

// Sanitize for S3 paths
function sanitizeForPath(str) {
  return str.replace(/[:*?"<>|\\\/]/g, '').replace(/\s+/g, '_');
}

// Send email with attachment
async function sendMailWithAttachment(name, email, pdfBuffer) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: '"Certificate Team" <charanclguse@gmail.com>',
    to: email,
    subject: 'Your Certificate',
    text: `Hi ${name},\n\nPlease find your certificate attached.\n\nRegards,\nCertificate Team`,
    attachments: [
      {
        filename: `${name}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });

  console.log(`📧 Email sent to ${email}`);
}

// Main function
async function generatePDF(name, course, batch, rollno, email) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load and customize template
  let html = fs.readFileSync(path.join(__dirname, '../templates/template.html'), 'utf-8');
  html = html.replace('{{name}}', name);

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Get PDF buffer
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  // Send mail before upload
  await sendMailWithAttachment(name, email, pdfBuffer);

  // Sanitize paths for S3
  const safeName = sanitizeForPath(name);
  const safeCourse = sanitizeForPath(course);
  const safeBatch = sanitizeForPath(batch);
  const fileName = `${safeName}_${rollno}.pdf`;
  const s3Key = `certificates/${safeCourse}/${safeBatch}/${fileName}`;

  // Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    })
  );

  const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  console.log('✅ Uploaded to S3:', s3Url);

  return s3Url;
}

module.exports = { generatePDF };
