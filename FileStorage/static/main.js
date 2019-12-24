const downloadsFile = document.getElementById("downloadsFile");
const form = document.getElementById("form");
const comment = document.getElementById("comment");
const file = document.getElementById("file");
const bar = document.getElementById("myBar");
const status = document.getElementById("status"); 
const socket = io.connect('http://localhost:8881');

const handleUpload = async (e) => {
    
    e.preventDefault();

    if(timer === null){
        alert('Сервер недоступен, попробуйте позже...');
    }else if(comment.value !== '' && file.value !== '') {
        const formData = new FormData(document.forms.form);

        const response = await fetch('/upload?id='+userId, {
            method: 'POST',
            body: formData
        });

        if(response.ok) {
            comment.value = '';
            file.value = '';
        }
    }else {
        alert('Заполните пожалуйста все поля!');
    }
}

const deleteHandler = async (name) => {
    
    if(confirm("Вы уверены, что хотите удалить?")){
        const res = await fetch('/removeFile/' + name,{method:"DELETE"});
        bar.style.width = '0%'; 
        bar.innerHTML = '';
        if(res.ok){
            getFiles();
        }
    }
}

const getFiles = async () => {
    const res = await fetch('/getFiles',{method:"POST"});
    const files = await res.json();
    const html = files.map( (d,i) => `<div class="fileBlock">
                                                <div>${d.comment}</div>
                                                <div>
                                                    <a href="/download/${d.originalname}">Загрузить</a>
                                                    <a href="javascript: void(0)" onclick="deleteHandler('${d.filename}')">Удалить</a>
                                                </div>
                                            </div>` ).join("");

    downloadsFile.innerHTML = html;
    
}

let userId = '';
let lastreply=new Date();
let timer = null;
form.addEventListener("submit", handleUpload);
getFiles();
let count = 0;
socket.on('progress', (data) => {
    const width = Math.round(data);
    bar.style.width = width + '%'; 
    bar.innerHTML = width * 1  + '%';
  });
socket.on('finished', (data) => {
    bar.style.width = '100%'; 
    bar.innerHTML = 'Файл загружен';
});
socket.on('new file', () => {
    getFiles();
});

socket.on('welcome', (id) => {
    connection_start(id);
});

 
socket.on('to pong', (data) => { 
    lastreply=new Date();
});

const connection_start = (id) => {
    console.log("Соединение появилось!");
    status.style.color = 'green'; 
    status.innerHTML = 'Соединение активно';
    userId = id;
    lastreply=new Date();
    if(timer !== null) clearTimer(timer);
    timer = setInterval(() => { 
        const t = new Date()-lastreply;
        if (t > 11000) {
            connection_lost();
        }else{
            socket.emit('to ping', { my: userId }) 
        }
    },5000);
}

const connection_lost = () => {
    console.log("Соединение пропало!");
    status.style.color = 'red'; 
    status.innerHTML = 'Соединение не активно, ожидайте...';
    clearTimer(timer);
}

const clearTimer = (t) => {
    clearInterval(t);
    timer = null;
}





  