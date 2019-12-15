const fs = require('fs').promises;
const path = require('path');
const templateFN = path.join(__dirname, '..', 'template.txt');

const getTemplate = async () => {
    const data = await fs.readFile(templateFN, "utf8");
    
    return JSON.parse(data);
}

const saveTemplate = async (templates, body) => {
    templates.push(body);
    const dataJSON = JSON.stringify(templates);

    await fs.writeFile(templateFN, dataJSON)
}

const removeTemplate = async (templates, body) => {
    const t = templates.filter((template,i)=>(i !== +body));

    const dataJSON = JSON.stringify(t);

    await fs.writeFile(templateFN, dataJSON);

    return t;
}

export {
    getTemplate,
    saveTemplate,
    removeTemplate
}