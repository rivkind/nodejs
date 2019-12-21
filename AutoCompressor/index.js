const fs = require('fs').promises;
var async = require('async');
const fsSync = require('fs');
const path = require('path');
const zlib = require('zlib');

const folder = process.argv[2];

const readDirectory = async (dirPath) => {
    try {
        const files = await fs.readdir(dirPath);

        async.eachSeries(files, async file => {
            if(!(/gz$/.test(file))){
                const filePath = path.join(dirPath, file);
                const fileInFolder = await fs.stat(filePath);
                if (fileInFolder.isDirectory()) {
                    console.log('Directory: ',filePath);
                    await readDirectory(filePath);
                } else if(fileInFolder.isFile()) {
                    console.log('File: ',filePath);
                    const gzipFN = filePath + '.gz';
                    try {
                        const gzipFile = await fs.stat(gzipFN);
                        if(fileInFolder.mtime > gzipFile.mtime) {
                            createGzip(filePath,gzipFN);
                        }
                    }catch (e) {
                        createGzip(filePath,gzipFN);
                    }
                }
            }
        })
    }catch (e) {
        console.log('Directory not found')
    }
}

const createGzip = async (originFile, gzFile) => {
    const inp = fsSync.createReadStream(originFile);
    const out = fsSync.createWriteStream(gzFile);
    await inp.pipe(zlib.createGzip()).pipe(out);
}

readDirectory(folder);
