const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const async = require('async');

const folder = process.argv[2];

const readDirectory = (dirPath) => {
    try {
        const files = fs.readdirSync(dirPath);

        async.eachSeries(files, async file => {
            if(!(/gz$/.test(file))){
                const filePath = path.join(dirPath, file);
                const fileInFolder = fs.statSync(filePath);
                if (fileInFolder.isDirectory()) {
                    console.log('Directory: ',filePath);
                    readDirectory(filePath);
                } else if(fileInFolder.isFile()) {
                    console.log('File: ',filePath);
                    const gzipFN = filePath + '.gz';
                    try {
                        const gzipFile = fs.statSync(gzipFN);
                        if(fileInFolder.mtime > gzipFile.mtime) {
                            await createGzip(filePath,gzipFN);
                        }
                    }catch (e) {
                        await createGzip(filePath,gzipFN);
                    }
                }
            }
        })
    }catch (e) {
        console.log('Directory not found')
    }
}

const createGzip = async (originFile, gzFile) => {
    
    await new Promise((resolve, reject) => {
        const inp = fs.createReadStream(originFile);
        const out = fs.createWriteStream(gzFile);
        inp.pipe(zlib.createGzip()).pipe(out);
        out.on('close', () => {
            console.log(`File created ${gzFile}`);
            resolve(out);
        })
    });
}

readDirectory(folder);
