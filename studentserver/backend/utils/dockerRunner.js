const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const runCodeInDocker = (code, language, input) => {
  return new Promise((resolve, reject) => {
    const id = Date.now();
    const dir = path.join(__dirname, `../temp_${id}`);

    try {
      fs.mkdirSync(dir, { recursive: true });

      let fileName, compileCmd = "", runCmd = "";

      switch (language) {
        case "c":
          fileName = "main.c";
          fs.writeFileSync(`${dir}/${fileName}`, code);
          compileCmd = "gcc main.c -o main";
          runCmd = "./main";
          break;

        case "cpp":
          fileName = "main.cpp";
          fs.writeFileSync(`${dir}/${fileName}`, code);
          compileCmd = "g++ main.cpp -o main";
          runCmd = "./main";
          break;

        case "java":
          fileName = "Main.java";
          fs.writeFileSync(`${dir}/${fileName}`, code);
          compileCmd = "javac Main.java";
          runCmd = "java Main";
          break;

        case "python":
          fileName = "main.py";
          fs.writeFileSync(`${dir}/${fileName}`, code);
          runCmd = "python3 main.py";
          break;

        case "javascript":
          fileName = "main.js";
          fs.writeFileSync(`${dir}/${fileName}`, code);
          runCmd = "node main.js";
          break;

        default:
          return reject("Unsupported language");
      }

      const fixedPath = dir.replace(/\\/g, "/");

      const cleanInput = String(input)
        .replace(/[^0-9\- ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const safeInput = cleanInput.replace(/"/g, '\\"');

      const fullCmd = `${compileCmd ? compileCmd + " && " : ""}printf "%s" "${safeInput}" | ${runCmd}`;

      const dockerCmd = `docker run --rm \
--memory="200m" \
--cpus="0.5" \
--network="none" \
-v ${fixedPath}:/app \
-w /app \
multi-runner \
bash -c "${fullCmd}"`;

      exec(dockerCmd, { timeout: 5000 }, (err, stdout, stderr) => {
        fs.rmSync(dir, { recursive: true, force: true });

        if (err) {
          console.error(stderr);
          return reject(stderr || err.message);
        }

        resolve(stdout.trim());
      });

    } catch (error) {
      fs.rmSync(dir, { recursive: true, force: true });
      reject(error);
    }
  });
};

module.exports = { runCodeInDocker };