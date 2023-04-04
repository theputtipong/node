const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const ffmpegPath = "./ffmpeg";
const fs = require('fs');

const app = express();
const upload = multer({ dest: `uploads/` });


app.set("view engine", "ejs");

app.use(express.static(`public`));

app.get("/trimvdo", function (req, res) {
  res.render("index");
});

app.post(`/upload`, upload.single("video"), (req, res) => {
  const inputFile = req.file.path;
  const outputFile = `uploads/${req.file.filename.split(".")[0]}-trimmed.mp4`;
  const maxDuration = 300; // 5 minutes in seconds

  const ffmpegProcess = spawn(ffmpegPath, [
    "-y", // Overwrite existing file
    "-i",
    inputFile,
    "-t",
    maxDuration,
    "-c",
    "copy", // Copy codec (no re-encoding)
    outputFile,
  ]);

  ffmpegProcess.on("close", () => {
    res.download(outputFile, (err) => {
      if (err) {
        console.error(`Error downloading file: ${err}`);
        res.status(500).send("Error downloading file");
      } else {
        // Delete the uploaded and trimmed files
        fs.unlinkSync(inputFile);
        fs.unlinkSync(outputFile);
      }
    });
  });
});

app.listen(80, () => {
  console.log(`Server running at 80`);
});
