
const socket = io();

let debug = false;
let connected = null;

socket.on("disconnect", () => connected = socket.connected);
socket.on("connect", () => {
    if (connected === null)
        connected = socket.connected;

    if (!connected)
        location.reload();
});

socket.on("send_document", (obj) => {
    handleDragLeave();

    if (obj.error) {
        let err = document.querySelector(".error");

        err.classList.add("show");
        document.body.classList.add("overflow-hidden");
        document.querySelectorAll("[id]").forEach(e => e.innerHTML = "&nbsp;");

        setTimeout(() => {
            err.classList.remove("show");
            document.body.classList.remove("overflow-hidden");
        }, 3500);

        err.querySelector("span").textContent = obj.error;
    } else {
        for (key in obj) {
            let element = document.querySelector(`#${key}`);

            if (element)
                element.innerHTML = `&nbsp;${obj[key]}`;
        }

        console.log(obj);
    }

    if (debug)
        console.info(obj.data);
});

const handleDragLeave = (ev) => {
    let tb = document.querySelector("table");

    document.querySelector(".loader").classList.remove("show");

    tb.classList.remove("hover","danger");
    tb.style.pointerEvents = null;
};

const handleDragOver = (ev) => {
    let items = [...ev.dataTransfer.items];
    let tb = document.querySelector("table");
    let mimetype = items[0].type || "[desconhecido]";

    tb.style.pointerEvents = "none";

    document.body.classList.remove("overflow-hidden");
    document.querySelector(".error").classList.remove("show");

    if (items.length === 1 && items[0].type === "application/pdf") {
        ev.dataTransfer.dropEffect = "move";
        tb.classList.add("hover");
    } else {
        ev.dataTransfer.dropEffect = "none";
        tb.classList.add("danger");

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
    const ld = document.querySelector(".loader");
    const reader = new FileReader();

    reader.addEventListener("load", (event) => {
        let buffer = event.target.result;

        socket.emit("send_document", buffer, debug);
    });

    ld.classList.add("show");
    reader.readAsArrayBuffer(file);
};

(function(){
    ["handleDrop", "handleDragOver", "handleDragLeave"].forEach(fn => {
        let event = fn.replace("handle", "").toLowerCase();

        document.body.addEventListener(event, eval(`${fn}`));
    });
})();