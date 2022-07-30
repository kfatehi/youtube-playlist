# youtube list to mp3 playlist

requires:
- ffmpeg
- yt-dlp

create a file called youtube-sources.txt

invoke the script with nodejs

the script will generate a list.m3u8 file

designed so that you can keep configuring the youtube-sources.txt file and re-running it.

the playlist will retain the order of appearance of the youtube links

it runs a little webserver
