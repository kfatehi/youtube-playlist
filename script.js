#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const cwd = process.cwd();

async function main(){
  let contentDir =  cwd+"/youtube-content";
  let ytSources =  cwd+"/youtube-sources.txt";
  let tempSources = cwd+"/__youtube-sources.txt";

  if (!fs.existsSync(contentDir)) {
    console.error('Directory missing: '+contentDir);
    process.exit(1)
  }

  if (!fs.existsSync(ytSources)) {
    console.error('Text file missing: '+ytSources);
    process.exit(1)
  }

  // get existing mp3
  let existingMp3 = fs.readdirSync(contentDir).reduce((acc, a)=>{
    let mat = a.match(/.+-(.+)\.mp3$/);
    if (mat) return [...acc, mat[1]];
    return acc;
  }, []);

  // exclude existing mp3
  let vidList = fs.readFileSync(ytSources).toString().split('\n').filter(a=>{
    if (a.length === 0)
      return false;

    if (/^#/.test(a))
      return false;

    for(let id of existingMp3) {
      if (a.match(RegExp(id+"$"))) {
        return false;
      }
    }

    return true;
  })

  if (vidList.length > 0) {
    // write it to disk for youtube-dl/ffmpeg to process...
    fs.writeFileSync(tempSources, vidList.join("\n"));
    try {
      await spawnAsync('youtube-dl', [
        '--write-info-json',
        '--write-annotations',
        '--write-description',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--no-post-overwrites',
        '--batch-file', tempSources
      ], {cwd: contentDir });
    } catch (err){

    } finally {
      fs.unlinkSync(tempSources);
    }
  }


  // make a playlist out of mp3s in order of appearance in source list
  let sourceListIds = fs.readFileSync(ytSources).toString().split('\n').reduce((acc,  a)=>{
    let mat = a.match(/v=(.+)$/)
    if (mat) return [...acc, mat[1]];
    return acc;
  }, []);

  let allMp3 = fs.readdirSync(contentDir).reduce((acc, a)=>{
    let mat = a.match(/\.mp3$/);
    if (mat) return [...acc, a];
    return acc;
  }, [])

  const lookupIdCache = {};
  const lookupId = (filename) => {
    if (lookupIdCache[filename]) {
      lookupIdCache[filename] 
    } else {
      lookupIdCache[filename] = JSON.parse(fs.readFileSync(contentDir+"/"+filename.replace(/\.mp3$/, '.info.json')))['display_id'];
    }
    return lookupIdCache[filename];
  }

  let sortedMp3List = allMp3.sort((a, b)=>{
    let ida = lookupId(a);
    let idb = lookupId(b);
    return sourceListIds.indexOf(ida) - sourceListIds.indexOf(idb);
  });

  fs.writeFileSync('list.m3u8', sortedMp3List.map(fp=>contentDir+"/"+fp).join('\n'));
}

async function spawnAsync(cmd, args=[], opts={}) {
  return new Promise((resolve, reject)=>{
    let proc = spawn(cmd, args, opts);
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on('exit', (code)=> code === 0 ? resolve() : reject());
  })
}

main();
