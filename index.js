const express = require('express');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require('fs');
const app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const tryParseInt = (value) => {
    if (!value) return value;

    if (!isNaN(value))
        return parseInt(value);

    return value;
}

let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.use(express.static('public'));

http.listen(process.env.PORT || 3000, function() {
    let host = http.address().address
    let port = http.address().port

    console.log('App listening at http://%s:%s', host, port)
});

io.on('connection', function(socket) {
    console.log('Client connected to the WebSocket');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('send_document', (buffer) => {
        pdfExtract.extractBuffer(buffer, {}, (err, data) => {
            if (err) return console.log(err);

            let arr = data.pages[0].content;
            let obj = {
                "matricula": tryParseInt(arr[20].str),
                "logradouro": arr[84].str.replace(`,${arr[84].str.split(",").pop()}`, ''),
                "numero": tryParseInt(arr[84].str.split(",").pop().replace(/\D/g, '')),
                "quadra": `${arr[56].str.slice(1).trim()}/${arr[60].str.slice(1).trim()}`,
                "lote": tryParseInt(arr[64].str),
                "bairro": arr[80].str.replace(/\W|\d/g, ''),
                "cep": `${arr[50].str.substring(0, 5)}-${arr[50].str.substring(5)}`,
                "cpf-cnpj": arr[34].str
            };

            socket.emit('send_document', obj);
        });
    });
});
