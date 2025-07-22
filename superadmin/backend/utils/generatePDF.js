const puppeteer = require("puppeteer");
const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const Student = require("../models/Student");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const User = require("../models/User");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.S3_BUCKET;

function imageToBase64(filePath) {
  const image = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1); // 'jpg', 'png'
  return `data:image/${ext};base64,${image.toString("base64")}`;
}

function sanitizeForPath(str) {
  return str.replace(/[:*?"<>|\\\/]/g, "").replace(/\s+/g, "_");
}

async function sendMailWithAttachments(name, email, attachments) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Cybernaut Certificate Team" <certificates@cybernaut.com>',
    to: email,
    subject: "Your Cybernaut Certificate(s)",
    text: `Hi ${name},\n\nPlease find your certificate(s) attached.\n\nRegards,\nCybernaut Team`,
    attachments,
  });

  console.log(`📧 Email sent to ${email}`);
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function generatePDF(name, courseName, batchName, rollNo, email, modules = []) {
  const isTechTrio = courseName.trim().toLowerCase() === "tech trio";
  const modulesToUse = isTechTrio && modules.length > 0 ? modules : [courseName];

  const browser = await puppeteer.launch();
  const attachments = [];

  // Base64 Images
  const logoBase64 = imageToBase64(path.join(__dirname, "../assets/logo.jpg"));
  const sign1Base64 = imageToBase64(path.join(__dirname, "../assets/sign1.jpg"));
  const sign2Base64 = imageToBase64(path.join(__dirname, "../assets/sign2.jpg"));

  for (let mod of modulesToUse) {
    const page = await browser.newPage();
    let html = fs.readFileSync(path.join(__dirname, "../templates/template.html"), "utf-8");

    html = html
      .replace(/{{name}}/g, name)
      .replace(/{{module}}/g, isTechTrio ? mod : courseName)
      .replace(/{{logo}}/g, logoBase64)
      .replace(/{{sign1}}/g, sign1Base64)
      .replace(/{{sign2}}/g, sign2Base64)
      .replace(/&lt;&lt;{{name}}&gt;&gt;/g, name)
      .replace(/&lt;&lt;Date&gt;&gt;/g, getCurrentDate())
      .replace(/&lt;&lt;UNIQUE_ID&gt;&gt;/g, rollNo) // or generate UUID
      .replace(/&lt;&lt;Per&gt;&gt;/g, "95");

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      width: "1200px",
      height: "950px",
      printBackground: true,
    });

    const safeName = sanitizeForPath(name);
    const safeBatch = sanitizeForPath(batchName);
    const safeCourse = sanitizeForPath(courseName);
    const safeMod = sanitizeForPath(mod);
    const fileName = `${safeName}_${safeMod}_${rollNo}.pdf`;
    const s3Key = `certificates/${safeCourse}/${safeBatch}/${fileName}`;

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    }));

    attachments.push({
      filename: fileName,
      content: pdfBuffer,
      contentType: "application/pdf",
    });

    console.log("✅ Uploaded to S3:", s3Key);
  }

  await browser.close();
  await sendMailWithAttachments(name, email, attachments);
}

module.exports = { generatePDF };
