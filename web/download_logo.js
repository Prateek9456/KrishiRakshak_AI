const fs = require('fs');

async function download() {
  try {
    const res = await fetch("https://upload.wikimedia.org/wikipedia/en/0/05/Indian_Council_of_Agricultural_Research_logo.svg", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync("public/images/icar-logo.svg", buffer);
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
download();
