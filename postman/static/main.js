const s = document.getElementById("status");
const tb = document.getElementById("headers");
const bt = document.getElementById("bodyText");
const bp = document.getElementById("bodyPreview");
const templateBlocks = document.getElementById("templateBlocks");

let templates = [];

const prepareData = () => {
    const param_keys = document.querySelectorAll('input[name=params-key]');
    const param_values = document.querySelectorAll('input[name=params-value]');
    let params = {};
    for (let i=0; i < param_keys.length; i++) {
        const key = param_keys[i].value || null;
        const value = param_values[i].value || true;

        if(key) {
            params = {
                ...params,
                [key]:value
            }
        }
    }

    const header_keys = document.querySelectorAll('input[name=headers-key]');
    const header_values = document.querySelectorAll('input[name=headers-value]');
    let headers = {};
    for (let i=0; i < header_keys.length; i++) {
        const key = header_keys[i].value || null;
        const value = header_values[i].value || true;

        if(key) {
            headers = {
                ...headers,
                [key]:value
            }
        }
    }

    const method = document.getElementById("method").value;
    const url = document.getElementById("url").value;
    const body = document.getElementById("body").value;


    const json = {
        method,
        url,
        body,
        params,
        headers
    }

    return json;
}

const saveHandler = async () => {
    const json = prepareData();

    const fetchOptions={
        method: "post",
        headers: {
                'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
    };

    const response=await fetch('/saveTemplate',fetchOptions);

    if(response.ok) {
        fillTemplates();
        
    }
}

const sendHandler = async () => {
    
    const json = prepareData();
    
    try {
        const res = await call_postman(json);
        
        const bodyRes = await res.json();
        
        if(res.status === 400) {
            throw Error(bodyRes.errorMessage);
        }
        const { status, statusText, headers, body} = bodyRes;
        s.innerHTML = status + " " + statusText;
        const contentType = headers['content-type'][0].toLowerCase();
        const bodyOutput = (contentType.includes('application/json'))? JSON.stringify(body) : body;

        fillResponseField(headers,bodyOutput);

    }catch (e) {
        alert(e.message);
    }
}

const fillResponseField = (h,b) => {
    fillHeaders(h);
    fillBody(b);
    fillPreview(b);
}

const fillPreview = (body) => {
    bp.contentWindow.document.open();
    bp.contentWindow.document.write(body);
    bp.contentWindow.document.close();
}

const fillBody = (b) => {
    bt.innerText = b;
}

const fillHeaders = (h) => {
    let html = '';
    for (pair in h) {
        html += `<tr><td>${pair}</td><td>${h[pair][0]}</td></tr>`;
    }
    tb.innerHTML = html;
}

const call_postman = async (data) => {
    const fetchOptions={
        method: "post",
        headers: {
                'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    };
    const response=await fetch('/getData',fetchOptions);

    return response;
}

const fillTemplates = async () => {
    const res = await fetch('/getTemplates',{method:"POST"});
    templates = await res.json();
    

    const html = templates.map( (d,i) => `<div class="templateBlock">
                                                <div>Шаблон ${(i+1)}</div>
                                                <div>
                                                    <div onclick="showHandler(${i})">Показать</div>
                                                    <div onclick="deleteHandler(${i})">Удалить</div>
                                                </div>
                                            </div>` ).join("");


    templateBlocks.innerHTML = html;
    
}

fillTemplates();

const showHandler = (id) => {
    document.getElementById("url").value = templates[id].url;
    document.getElementById("body").value = templates[id].body;


    const m = document.getElementById("method").options;

    

    for(let i=0; i < m.length; i++) {
        if(m[i].value === templates[id].method){
            document.getElementById("method").selectedIndex = i;
        }
        
    }

    const param_keys = document.querySelectorAll('input[name=params-key]');
    const param_values = document.querySelectorAll('input[name=params-value]');

    const header_keys = document.querySelectorAll('input[name=headers-key]');
    const header_values = document.querySelectorAll('input[name=headers-value]');

    let i = 0;

    const params = [];
    const headers = [];

    for (key in templates[id].params) {
       params[i] = [key,templates[id].params[key]]; 
       i++;
    }

    i=0;

    for (key in templates[id].headers) {
        headers[i] = [key,templates[id].headers[key]]; 
        i++;
     }



    for(let i = 0; i < param_keys.length; i++) {
        param_keys[i].value = (params[i] !== undefined)? params[i][0] : '';
        param_values[i].value = (params[i] !== undefined)? params[i][1] : '';
    }

    for(let i = 0; i < header_keys.length; i++) {
        header_keys[i].value = (headers[i] !== undefined)? headers[i][0] : '';
        header_values[i].value = (headers[i] !== undefined)? headers[i][1] : '';
    }
    

    
}

const deleteHandler = async (id) => {
    const res = await fetch('/removeTemplates',{method:"POST",body: id});
    if(res.ok){
        fillTemplates();
    }
}
