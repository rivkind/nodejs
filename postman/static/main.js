const s = document.getElementById("status");
const tb = document.getElementById("headers");
const bt = document.getElementById("bodyText");
const bp = document.getElementById("bodyPreview");

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

const sendHandler = () => {
    
    const json = prepareData();
    
    call_postman(json).then((res)=>{
        
        const status = res.status + " " + res.statusText;
        
        s.innerHTML = status;
        
         writeHeaders(res.headers);

        return res.text();
    }).then((body)=>{
        
        bt.innerText = body; 
        bp.innerHTML = body; 
    }).catch((e)=>{

    });
}

const writeHeaders = (headers) => {
    let html = '';
    for (var pair of headers.entries()) {
        html += `<tr><td>${pair[0]}</td><td>${pair[1]}</td></tr>`;
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
    const templates = await res.json();
    console.log(templates);
}

fillTemplates();