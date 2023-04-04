const express = require("express");
const multer = require("multer");
const { spawn } = require("child_process");
const ffmpegPath = "./ffmpeg";
const fs = require("fs");
const api = express();

const upload = multer({ dest: `uploads/` });

api.set("view engine", "ejs");

app.use(express.static(`public`));

api.get("/api/trimvdo", function (req, res) {
  res.render("index");
});

api.post(`/api/upload`, upload.single("video"), (req, res) => {
  const inputFile = req.file;

  const outputFile = `uploads/${inputFile.originalname.split(".")[0]}_trimmed.mp4`;
  const maxDuration = 300; // 5 minutes in seconds

  const ffmpegProcess = spawn(ffmpegPath, [
    "-y",
    "-i",
    inputFile.path,
    "-t",
    maxDuration,
    "-c",
    "copy",
    outputFile,
  ]);

  ffmpegProcess.on("close", () => {
    res.download(outputFile, (err) => {
      if (err) {
        console.error(`Error downloading file: ${err}`);
        res.status(500).send("Error downloading file");
      } else {
        // Delete the uploaded and trimmed files
        fs.unlinkSync(inputFile.path);
        fs.unlinkSync(outputFile);
      }
    });
  });
});

api.listen(80, () => {
  console.log(`Server running at 80`);
});
