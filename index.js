const express = require("express");
const multer = require("multer");
const ffmpeg = require("ffmpeg");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const api = express();

api.use(
  cors({
    origin: "https://pdouvch.com/api/*",
  })
);

const corsOptions = {
  origin: "https://pdouvch.com/api/list",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Set up Multer middleware to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

api.set("views", path.join(__dirname, "views"));
api.set("view engine", "ejs");

// Home page route
api.get("/api", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

api.get("/api/list", cors(corsOptions), (req, res) => {
  // Read the contents of the uploads directory
  fs.readdir("uploads", (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("An error occurred");
    }

    // Filter the list to only include video files
    const videoFiles = files.filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return (
        extension === ".mp4" || extension === ".webm" || extension === ".ogg"
      );
    });

    // Render the HTML page with the list of videos
    res.render("index", { videos: videoFiles });
  });
});

// Upload file route
api.post("/api/upload", upload.single("video"), async (req, res) => {
  const path = req.file.path;
  try {
    const video = new ffmpeg(path);
    video.then(function (video) {
      // Get video duration
      const duration = video.metadata.duration.seconds;

      // Trim the video if it's longer than 5 minutes
      if (duration > 300) {
        video
          .setVideoDuration(300)
          .save(`trimmeds/trimmed.mp4`, function (error, file) {
            if (!error) {
              console.log("Video trimmed successfully");
              res.redirect("/api/list");
            }
          });
      } else {
        console.log("Video uploaded successfully");
        res.redirect("/api/list");
      }
    });
  } catch (error) {
    console.log(error);
    res.send("Error occurred while trimming the video");
  }
});

api.get("/api/download/:filename", (req, res) => {
  const filePath = `${__dirname}/uploads/${req.params.filename}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found.");
  }

  res.download(filePath);
});

api.get("/api/delete/:filename", (req, res) => {
  const folderPath = path.join(__dirname, "uploads");
  const filePath = path.join(folderPath, req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting video");
    }
    // res.send('Video deleted successfully');
    res.redirect("/api/list");
  });
});

api.listen(80, () => {
  console.log("Server is running on port 80");
});
