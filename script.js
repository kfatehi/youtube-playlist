const { spawn } = require('child_process');
const fs = require('fs');


async function main(){
    // get existing mp3
    let existingMp3 = fs.readdirSync('.').reduce((acc, a)=>{
        let mat = a.match(/.+-(.+)\.mp3$/);
        if (mat) return [...acc, mat[1]];
        return acc;
    }, []);

    // exclude existing mp3
    let vidList = fs.readFileSync('youtube-sources.txt').toString().split('\n').filter(a=>{
        for(let id of existingMp3) {
            if (a.match(RegExp(id+"$"))) {
                return false;
            }
        }
        return true;
    })

    // write it to disk for youtube-dl/ffmpeg to process...
    fs.writeFileSync("__youtube-sources.txt", vidList.join("\n"));

    try {
        await spawnAsync('youtube-dl', [
            '--write-info-json',
            '--write-annotations',
            '--write-description',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--no-post-overwrites',
            '--batch-file', '__youtube-sources.txt'
        ]);
    } catch (err){
        


        
    }


    // make a playlist out of mp3s
    let allMp3 = fs.readdirSync('.').reduce((acc, a)=>{
        let mat = a.match(/\.mp3$/);
        if (mat) return [...acc, a];
        return acc;
    }, [])
    fs.writeFileSync('list.m3u8', allMp3.join('\n'));
}

async function spawnAsync(cmd, args=[]) {
    return new Promise((resolve, reject)=>{
        let proc = spawn(cmd, args);
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);
        proc.on('exit', (code)=> code === 0 ? resolve() : reject());
    })
}

main();