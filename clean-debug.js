const fs = require("fs");
const path = require("path");

// Function to safely remove debug console.log statements
function cleanDebugFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Remove debug console statements with emojis and debug keywords
    let cleaned = content
      // Remove console.log statements with debug emojis
      .replace(/^\s*console\.log\([^)]*[🧪🔍📞🔄✅❌⚠️][^)]*\);?\s*$/gm, "")
      // Remove console.log statements with "debug" keyword
      .replace(/^\s*console\.log\([^)]*[Dd]ebug[^)]*\);?\s*$/gm, "")
      // Remove console.warn statements with debug emojis
      .replace(/^\s*console\.warn\([^)]*[🧪🔍📞🔄✅❌⚠️][^)]*\);?\s*$/gm, "")
      // Remove debug comment lines
      .replace(/^\s*\/\/ Debug.*$/gm, "")
      .replace(/^\s*\/\/ Enhanced debugging.*$/gm, "")
      .replace(/^\s*\/\/ Log.*debug.*$/gm, "");

    // Remove empty lines that were left behind
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");

    if (content !== cleaned) {
      fs.writeFileSync(filePath, cleaned, "utf8");
      console.log(`Cleaned debug statements from: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to walk directory recursively
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (
      stat.isFile() &&
      (file.endsWith(".ts") || file.endsWith(".tsx"))
    ) {
      callback(filePath);
    }
  });
}

// Clean debug statements from src directory
const srcDir = path.join(__dirname, "src");
walkDir(srcDir, cleanDebugFromFile);

console.log("Debug cleanup completed!");
