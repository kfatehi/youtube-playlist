const { spawn } = require('child_process');
const fs = require('fs');


async function main(){
    // get existing mp3
    let existingMp3 = fs.readdirSync('youtube-content').reduce((acc, a)=>{
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

    let tempSources = __dirname+"/__youtube-sources.txt";

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
        ], {cwd: __dirname+"/youtube-content" });
    } catch (err){
        
    } finally {
        fs.unlinkSync(tempSources);
    }


    // make a playlist out of mp3s in order of appearance in source list
    let sourceListIds = fs.readFileSync('youtube-sources.txt').toString().split('\n').reduce((acc,  a)=>{
        let mat = a.match(/v=(.+)$/)
        if (mat) return [...acc, mat[1]];
        return acc;
    }, []);

    let allMp3 = fs.readdirSync('.').reduce((acc, a)=>{
        let mat = a.match(/\.mp3$/);
        if (mat) return [...acc, a];
        return acc;
    }, [])

    const lookupIdCache = {};
    const lookupId = (filename) => {
        if (lookupIdCache[filename]) {
            lookupIdCache[filename] 
        } else {
            lookupIdCache[filename] = JSON.parse(fs.readFileSync(filename.replace(/\.mp3$/, '.info.json')))['display_id'];
        }
        return lookupIdCache[filename];
    }

    let sortedMp3List = allMp3.sort((a, b)=>{
        let ida = lookupId(a);
        let idb = lookupId(b);
        return sourceListIds.indexOf(ida) - sourceListIds.indexOf(idb);
    });

    fs.writeFileSync('list.m3u8', sortedMp3List.join('\n'));
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