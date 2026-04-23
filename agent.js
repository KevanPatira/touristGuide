import readline from "readline";
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "minimax/minimax-m2.5:free";

if (!API_KEY) {
  console.error("❌ Missing API key in .env");
  process.exit(1);
}

// ---------- Helpers ----------
const readFile = (p) => {
  if (fs.existsSync(p)) return fs.readFileSync(p, "utf-8");
  return null;
};

const writeFileSafe = async (filePath, content) => {
  console.log("\n⚠️ Proposed changes:\n");
  console.log(content.slice(0, 800) + "\n...");

  const confirm = await askQuestion("Apply changes? (y/n): ");
  if (confirm.toLowerCase() === "y") {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("✅ File updated:", filePath);
  } else {
    console.log("❌ Cancelled.");
  }
};

const askAI = async (prompt) => {
  const res = await axios.post(
    API_URL,
    {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
};

// ---------- CLI ----------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (q) =>
  new Promise((resolve) => rl.question(q, resolve));

console.log("🚀 PRO AI Agent Ready\nType /help\n");

// ---------- Command Handler ----------
const handleCommand = async (input) => {
  const [cmd, ...rest] = input.split(" ");
  const arg = rest.join(" ");

  if (cmd === "/help") {
    console.log(`
Commands:
  /read file.js        → Read file
  /fix file.js         → Suggest & apply fix
  /create file.js      → Create new file
  /write file.js       → Overwrite file
  exit                 → Quit
`);
    return;
  }

  if (cmd === "/read") {
    const content = readFile(arg);
    if (!content) return console.log("❌ File not found");
    console.log("\n📄 File Content:\n", content.slice(0, 1500), "\n");
    return;
  }

  if (cmd === "/fix") {
    const content = readFile(arg);
    if (!content) return console.log("❌ File not found");

    const prompt = `
Fix bugs and improve this file. Return ONLY the updated code.

File: ${arg}

${content}
`;

    const response = await askAI(prompt);
    await writeFileSafe(arg, response);
    return;
  }

  if (cmd === "/create") {
    const prompt = `
Create a complete file for a React Native project.

File: ${arg}
`;

    const response = await askAI(prompt);
    await writeFileSafe(arg, response);
    return;
  }

  if (cmd === "/write") {
    const prompt = `
Write complete code for this file in a React Native + Node project:

File: ${arg}
`;

    const response = await askAI(prompt);
    await writeFileSafe(arg, response);
    return;
  }

  // Default chat
  const response = await askAI(input);
  console.log("\nAI:\n", response, "\n");
};

// ---------- Loop ----------
const loop = async () => {
  const input = await askQuestion("You: ");
  if (input === "exit") return rl.close();

  try {
    await handleCommand(input);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }

  loop();
};

loop();