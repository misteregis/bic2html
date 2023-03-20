const express = require('express');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const fs = require('fs');
const app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.set('Content-Type', 'text/html');

    fs.readFile(`${__dirname}/template.html`, 'utf8', (err, text) => {
        text = text.replace('{{ hostname }}', req.hostname);
        text = text.replace('{{ WS_PORT }}', PORT);

        res.send(text);
    });
});

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
                "matricula": arr[20].str,
                "logradouro": arr[84].str.replace(`,${arr[84].str.split(",").pop()}`, ''),
                "numero": arr[84].str.split(",").pop().replace(/\D/g, ''),
                "quadra": `${arr[56].str.slice(1).trim()}/${arr[60].str.slice(1).trim()}`,
                "lote": arr[64].str,
                "bairro": arr[80].str.replace(/\W|\d/g, ''),
                "cep": `${arr[50].str.substring(0, 5)}-${arr[50].str.substring(5)}`,
                "cpf-cnpj": arr[34].str
            };

            socket.emit('send_document', obj);
        });
    });
});
