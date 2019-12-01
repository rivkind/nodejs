let votes = [];

const mimeHtml = 'text/html';
const mimeJson = 'application/json';
const mimeXML = 'application/xml';
const typeMime = [
    {type: mimeHtml, text: 'HTML'},
    {type: mimeJson, text: 'JSON'},
    {type: mimeXML, text: 'XML'},
];
let accept = mimeHtml;


const r = document.getElementById("result");
const root = document.getElementById("root");
const e = document.getElementById("export");
const ef = document.getElementById("exportField");
const f = document.getElementById("format");

const vote = async (data) => {

    const fetchOptions={
        method: "post",
        body: data,
    };
    await fetch('/vote',{method: "post", body: data});
    getResult();
}

const getResult = async () => {
    r.innerHTML = 'Loading...';
    e.style.display = "none";
    
    const fetchOptions={
        headers: { 'Accept': accept },
    };
    const response=await fetch('/stat',fetchOptions);

    const contentType = response.headers.get('content-type');

    let data;

    if(contentType.includes(mimeJson)) {
        dataJson = await response.json();
        data = JSON.stringify(dataJson);
    } else {
        data = await response.text();
    }

    
    if(contentType.includes(mimeHtml)) {
        r.innerHTML =data;
    } else {
        r.innerText = data;
    }

    ef.value = accept;
    
    e.style.display = "block";
}

const renderFormat = () => {
    const html = `Формат результатов: ${typeMime.map( d => `<a onClick=changeFormat("${d.type}")>${d.text}</a>` ).join("")}`;
    
    f.innerHTML = html;
}

const renderVote = (data) => {
    const html = data.map( d => `<div><button onClick=vote("${d.code}")>${d.text}</button></div>` ).join("");
    root.innerHTML = html;
    renderFormat();
    getResult();
}

const changeFormat = (format) => {
    accept = format;
    getResult();
}

const fetchVote = async () => {
    const response=await fetch('/variants');
    const data = await response.json();
    return data;
}

window.onload = (e) => {
    fetchVote()
        .then(data => renderVote(data))
        .catch(e => console.log(e));
        
}
