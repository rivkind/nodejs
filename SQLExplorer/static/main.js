const button = document.getElementById("button");
const db = document.getElementById("database");
const query = document.getElementById("query");
const res = document.getElementById("res");

const runHandler = async () => {
    if(db.value !== '' && query.value !== '') {
        const data = { db: db.value, query: query.value}

        const response = await fetch('/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(response.status === 500) {
            res.innerHTML = 'ошибка запроса';
        } else {
            const bodyRes = await response.json();
            if(Array.isArray(bodyRes)) {
                const headers = [];
                for ( let keys in bodyRes[0] ) {
                    headers.push(keys);
                }
                let html = `<table border='1'><thead><tr>`;
                for(let i=0; i<headers.length; i++) {
                   html += `<th>${headers[i]}</th>` 
                }
    
                html += `</tr></thead><tdody>`;
                for(let i=0; i<bodyRes.length; i++) {
                    let rows = '';
                    for(let j=0; j<headers.length; j++) {
                        rows += `<td>${bodyRes[i][headers[j]]}</td>`;
                    }
                    html += `<tr>${rows}</tr>`;
                }
                html += `</tdody></table>`;
                res.innerHTML = html;
            } else {
                res.innerHTML = "Затронуто строк: " + bodyRes.affectedRows; 
            }
        }
        

    } else {
        alert('Заполните все поля!');
    }
}


button.addEventListener("click", runHandler);
  