const insc = document.querySelector("#matricula");
const table = document.querySelector(".table");
const dl = document.querySelector(".download");
const ld = document.querySelector(".loader");
const err = document.querySelector(".error");
const body = document.body;

const delay = 3500;
const socket = io();

let debug = location.search.slice(1) === "debug";
let connected = null;
let _timeout = null;

socket.on("disconnect", () => connected = socket.connected);
socket.on("connect", () => {
    if (connected === null)
        connected = socket.connected;

    if (!connected)
        location.reload();
});

socket.on("send_document", (obj) => {
    handleDragLeave();

    let debug_data = obj.data;

    delete obj.data;

    if (obj.error) {
        let { stack } = obj;

        err.classList.add("show");

        document.querySelectorAll("[id]").forEach(e => e.innerHTML = "&nbsp;");

        if (debug) {
            console.debug(stack);

            error(stack, delay * 10);
        } else
            error(null);
    } else {
        for (key in obj) {
            let element = document.querySelector(`#${key}`);

            if (element)
                element.innerHTML = `&nbsp;${obj[key]}`;
        }

        dl.classList.add("show");

        console.log(obj);
    }

    if (debug)
        console.debug(debug_data);
});

const loader = (action = "show") => {
    const method = action === "show" ? "add" : "remove";

    dl.style.zIndex = null;

    if (method === "add")
        dl.style.zIndex = 0;

    ld.classList[method]("show");
};

const handleDragLeave = (ev) => {
    let tb = document.querySelector("table");

    loader("hide");

    body.classList.remove("hover","danger");
    tb.style.pointerEvents = null;
};

const handleDragOver = (ev) => {
    let items = [...ev.dataTransfer.items];
    let tb = document.querySelector("table");
    let mimetype = items[0].type || "[desconhecido]";

    tb.style.pointerEvents = "none";

    body.classList.remove("overflow-hidden");
    err.classList.remove("show");

    if (items.length === 1 && items[0].type === "application/pdf") {
        ev.dataTransfer.dropEffect = "move";
        body.classList.add("hover");
    } else {
        ev.dataTransfer.dropEffect = "none";
        body.classList.add("danger");

        let msg = "Apenas um arquivo";

        if (items.length === 1)
            msg = `O mimetype ${mimetype} não`;

        console.log(`${msg} é permitido!`);
    }

    ev.preventDefault();
};

const handleDrop = (ev) => {
    let file;

    if (ev.dataTransfer.items) {
        file = [...ev.dataTransfer.items].pop().getAsFile();
    } else {
        file = [...ev.dataTransfer.files].pop();
    }

    readDocument(file);

    ev.preventDefault();
};

const readDocument = (file) => {
    const reader = new FileReader();

    reader.addEventListener("load", (event) => {
        let buffer = event.target.result;

        socket.emit("send_document", buffer, debug);
    });

    loader("show");

    dl.classList.remove("show");
    reader.readAsArrayBuffer(file);
};

const error = (message, timeout, title = "Ocorreu um erro na extração dos dados") => {
    err.querySelector("h1").textContent = title + (!message ? "." : "");
    err.querySelector("span").textContent = message;
    body.classList.add("overflow-hidden");
    err.classList.add("show");

    if (_timeout) clearTimeout(_timeout);

    _timeout = setTimeout(() => {
        body.classList.remove("overflow-hidden");
        err.classList.remove("show");
    }, timeout || delay);
};

const download = () => {
    let m = insc.textContent.trim();
    let filename = `BIC_[${m}]`;

    if (m) {
        let opt = {
            margin:       1,
            filename:     `${filename}_${Math.round(+new Date() / 1000)}.pdf`,
            image:        { type: 'webp', quality: 1 },
            html2canvas:  { scale: 1, width: 825, windowWidth: 825 },
            jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
        };

        loader("show");

        html2pdf().from(table).set(opt).toPdf().get("pdf").then((pdf) => {
            loader("hide");

            pdf.setProperties({
                author: `by ${document.title}`,
                subject: `Matrícula: ${m}`
            });
        }).save();
    } else
        error(null, null, "É obrigatório ter uma matrícula.");
};

(() => {
    window.jsPDF = window.jspdf.jsPDF;

    document.querySelector(".download").addEventListener("click", download);

    ["handleDrop", "handleDragOver", "handleDragLeave"].forEach(fn => {
        let event = fn.replace("handle", "").toLowerCase();

        body.addEventListener(event, eval(`${fn}`));
    });
})();