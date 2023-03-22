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

const getValue = (data, key) => data[key].str;

const getJSON = (data) => {
    let obj = {};
    let k = {
        matricula: 20,
        logradouro: 84,
        setor: 56,
        quadra: 60,
        lote: 64,
        bairro: 80,
        cep: 50,
        cpf_cnpj: 34
    };

    try {
        let arr = data.pages[0].content;

        if (!arr.find(y => y.str === 'Matrícula :')) {
            k.logradouro = 24;
            k.setor = 65;
            k.quadra = 69;
            k.lote = 73;
            k.bairro = 28;
            k.cep = 49;
            k.cpf_cnpj = 41;
        }

        let logradouro = getValue(arr, k.logradouro);
        let cep = getValue(arr, k.cep).replace(/\D/g, '');
        let setor = getValue(arr, k.setor).slice(-3).trim();
        let quadra = getValue(arr, k.quadra).slice(-3).trim();

        obj = {
            "matricula": getValue(arr, k.matricula),
            "logradouro": logradouro.replace(`,${logradouro.split(",").pop()}`, '').replace(/\d+\s+-\s+/g, '').trim(),
            "numero": logradouro.split(",").pop().replace(/\D/g, ''),
            "quadra": `${setor}/${quadra}`,
            "lote": getValue(arr, k.lote),
            "bairro": getValue(arr, k.bairro).replace(/\W|\d/g, ''),
            "cep": `${cep.substring(0, 5)}-${cep.substring(5)}`,
            "cpf-cnpj": getValue(arr, k.cpf_cnpj)
        };
    } catch {
        obj = { error: true, data };
    }

    return obj;
};

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

            socket.emit('send_document', getJSON(data));
        });
    });
});
