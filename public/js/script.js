
const socket = io();

socket.on('send_document', (obj) => {
    for (key in obj) {
        let element = document.querySelector(`#${key}`);

        if (element)
            element.innerHTML = `&nbsp;${obj[key]}`;
    }

    handleDragLeave();
    console.log(obj);
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
        socket.emit("send_document", event.target.result);
    });

    ld.classList.add("show");
    reader.readAsArrayBuffer(file);
};

(function(){
    ["handleDrop", "handleDragOver", "handleDragLeave"].forEach(fn => {
        let event = fn.replace("handle", "").toLowerCase();
        // console.log(eval(`${fn}('x')`))
        console.log(event);
        document.body.addEventListener(event, eval(`${fn}`));
    });
})();