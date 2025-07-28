const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/check-submissions", async (req, res) => {
  const { batchName, studentName, rollNo, modules } = req.body;

  if (!batchName || !studentName || !rollNo || !modules || !Array.isArray(modules)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sanitize = (val) => encodeURIComponent(val.trim());

  const checkHead = async (url) => {
    try {
      await axios.head(url);
      return true;
    } catch {
      return false;
    }
  };

  const results = await Promise.all(
    modules.map(async (mod) => {
      const questionUrl = `https://cybernautedutech.s3.eu-north-1.amazonaws.com/${sanitize(batchName)}/project/${sanitize(mod)}.pdf`;
      const answerUrl = `https://cybernautedutech.s3.eu-north-1.amazonaws.com/${sanitize(batchName)}/${sanitize(mod)}/evaluation/project/answers/${sanitize(studentName)}_${rollNo}/answer.pdf`;

      const [questionExists, answerExists] = await Promise.all([
        checkHead(questionUrl),
        checkHead(answerUrl),
      ]);

      return {
        module: mod,
        questionUrl: questionExists ? questionUrl : null,
        answerUrl: answerExists ? answerUrl : null,
        questionExists,
        answerExists,
      };
    })
  );

  res.json(results);
});

module.exports = router;
