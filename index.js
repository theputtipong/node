const express = require('express');
const multer = require('multer');
const ffmpeg = require('ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const api = express();

api.use(cors(
  {
    origin: 'https://pdouvch.com/api/*'
  }
));

const corsOptions = {
  origin: 'https://pdouvch.com/api/list',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// Set up Multer middleware to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

api.set('views', path.join(__dirname, 'views'));
api.set('view engine', 'ejs');

// Home page route
api.get('/api', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


api.get('/api/list', cors(corsOptions),(req, res) => {
  // Read the contents of the uploads directory
  fs.readdir('uploads', (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred');
    }

    // Filter the list to only include video files
    const videoFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return extension === '.mp4' || extension === '.webm' || extension === '.ogg';
    });

    // Render the HTML page with the list of videos
    res.render('index', { videos: videoFiles });
  });
});

// Upload file route
api.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    const { mimetype, size } = req.file;

    // Check if uploaded file is a video and its size is less than or equal to 300MB
    if (mimetype.startsWith('video/') && size <= 300000000) {
      const video = await new ffmpeg('./ffmpeg');
      // const video = await new ffmpeg(req.file.path);

      // Get video duration in seconds
      const duration = Math.ceil(video.metadata.duration.seconds);

      // Check if video duration is more than 5 minutes
      if (duration > 200) {
        // Calculate number of parts to split the video into
        const numParts = Math.ceil(duration / 200);

        // Trim and split video file
        for (let i = 0; i < numParts; i++) {
          const startTime = i * 200;
          const endTime = Math.min((i + 1) * 200, duration);

          const outputFile = path.join(__dirname, `uploads/trimmed_${i}.mp4`);
          await video.fnTranscode(outputFile, 'libx264', 'aac', {
            t: 200,
            start_time: startTime,
            end_time: endTime,
          });
        }

        // Send response indicating that video was uploaded and processed successfully
        // res.send('Video was uploaded and processed successfully!');
        res.redirect('/api/list');
      } else {
        // Send response indicating that video was uploaded successfully but was not processed
        // res.send('Video was uploaded successfully but was not processed because its duration is less than or equal to 5 minutes.');
        res.redirect('/api/list');
      }
    } else {
      // Send response indicating that uploaded file is not a video or its size is more than 300MB
      res.send('Uploaded file is not a video or its size is more than 300MB.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while processing the video.');
  }
});


api.get('/api/download/:filename', (req, res) => {
  const filePath = `${__dirname}/uploads/${req.params.filename}`;
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found.');
  }

  res.download(filePath);
});

api.get('/api/delete/:filename', (req, res) => {
  const folderPath = path.join(__dirname, 'uploads');
  const filePath = path.join(folderPath, req.params.filename);
  fs.unlink(filePath, err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error deleting video');
    }
    // res.send('Video deleted successfully');
    res.redirect('/api/list');
  });
});

api.listen(80, () => {
  console.log('Server is running on port 80');
});
