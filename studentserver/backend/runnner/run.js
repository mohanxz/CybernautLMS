const fs = require("fs");

const input = process.argv[2];

let data = "";
process.stdin.on("data", chunk => data += chunk);

process.stdin.on("end", () => {
  try {
    eval(data); // only inside container (safe)
  } catch (err) {
    console.error(err.message);
  }
});