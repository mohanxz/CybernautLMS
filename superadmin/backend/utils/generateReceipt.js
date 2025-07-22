const puppeteer = require('puppeteer');
const path = require('path');
const {
  S3Client,
  PutObjectCommand
} = require('@aws-sdk/client-s3');

require('dotenv').config();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateReceiptPDF = async (adminName, amount, receiverId, paymentId) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  const paymentDate = new Date().toLocaleDateString();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
        }
        .receipt {
          width: 1123px;
          height: 794px;
          border: 10px solid #007BFF;
          padding: 50px;
          box-sizing: border-box;
          font-family: 'Georgia', serif;
          position: relative;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .company-name {
          font-size: 36px;
          font-weight: bold;
          color: #007BFF;
        }
        .company-info {
          font-size: 18px;
          color: #555;
        }
        .receipt-title {
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          margin-top: 40px;
          margin-bottom: 20px;
          color: #007BFF;
          text-decoration: underline;
        }
        .details {
          font-size: 20px;
          color: #222;
          line-height: 2;
          margin-left: 80px;
        }
        .highlight {
          font-weight: bold;
          color: #007BFF;
        }
        .footer {
          position: absolute;
          bottom: 40px;
          font-size: 16px;
          color: #777;
          text-align: center;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="company-name">Cybernaut EduTech</div>
          <div class="company-info">
            1234 Silicon Lane, Tech City, IN - 560001<br>
            Email: support@cybernaut.com | Phone: +91-9876543210
          </div>
        </div>

        <div class="receipt-title">Payment Receipt</div>

        <div class="details">
          <div><span class="highlight">Receiver ID:</span> ${receiverId}</div>
          <div><span class="highlight">Name:</span> ${adminName}</div>
          <div><span class="highlight">Payment ID:</span> ${paymentId}</div>
          <div><span class="highlight">Payment Date:</span> ${paymentDate}</div>
          <div><span class="highlight">Amount Paid:</span> ₹${(amount / 100).toFixed(2)}</div>
          <div><span class="highlight">Payment Method:</span> UPI</div>
        </div>

        <div class="footer">
          © 2025 Cybernaut EduTech. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  const fileName = `${Date.now()}-${adminName.replace(/\s+/g, '-')}.pdf`;
  const s3Key = `receipts/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    })
  );

  const s3Url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
  return s3Url;
};

module.exports = generateReceiptPDF;
