const fs = require('fs').promises;
const path = require('path');
const filesFN = path.join(__dirname, '..', 'files.txt');

const getFiles = async () => {
    const data = await fs.readFile(filesFN, "utf8");
    
    return JSON.parse(data);
}

const saveFiles = async (files, body) => {
    files.push(body);
    const dataJSON = JSON.stringify(files);

    await fs.writeFile(filesFN, dataJSON)
}

const removeFile = async (files, body) => {

    const index = files.findIndex((file,i)=>(file.filename === body));

    if(index !== -1){
        const filePath = path.join(__dirname,"..","uploads",files[index].filename);
        await fs.unlink(filePath);
    }
    
    const f = files.filter(file => file.filename !== body);

    const dataJSON = JSON.stringify(f);

    await fs.writeFile(filesFN, dataJSON);

    return f;
}

module.exports = {
    getFiles,
    saveFiles,
    removeFile
}