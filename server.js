const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const mediaDir = './youtube-content';
const secsToHMS = (secs) => new Date(secs * 1000).toISOString().slice(11, 19);
const preferFormat = 'webm';
const ytMediaPattern = new RegExp(`\]\.${preferFormat}$`);
const extPattern = new RegExp(`\.${preferFormat}$`);
app.set('view engine', 'ejs');
app.use('/media', express.static(mediaDir));
app.get('/', (req, res, next)=>{
  fs.readdir(mediaDir, (err, media)=>{
    if (err) return next(err);
    media = media.filter(m=>!/\]\.f\d\d\d/.test(m) && ytMediaPattern.test(m));
    let metadata = media.map((m)=>{
      return JSON.parse(fs.readFileSync(path.join(mediaDir,m).replace(extPattern, '.info.json')));
    });
    res.render('index', {
      media,
      metadata,
      count: media.length,
      totalDuration: secsToHMS(metadata.reduce((i,a)=>i+a.duration, 0))
    });
  });
});
app.listen(9000);

