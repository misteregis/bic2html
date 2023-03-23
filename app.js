const express = require('express');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const app = express();

const tryParseInt = (value) => {
    if (!value) return value;

    if (!isNaN(value))
        return parseInt(value);

    return value;
}

const getValue = (data, key, keys = []) => {
    let value = data[key].str;

    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];

        if (!value.match(/\d/g))
            value = getValue(data, k);
        else
            break;
    }

    return value;
};

const getJSON = (data, debug) => {
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

        let matricula = getValue(arr, k.matricula);
        let logradouro = getValue(arr, k.logradouro);
        let cep = getValue(arr, k.cep).replace(/\D/g, '');
        let setor = getValue(arr, k.setor, [ 77 ]).slice(-3);
        let quadra = getValue(arr, k.quadra, [ 81 ]).slice(-3);
        let lote = getValue(arr, k.lote, [ 85 ]);

        obj = {
            "matricula": `${matricula.slice(0, -1)}-${matricula.slice(-1)}`,
            "logradouro": logradouro.replace(`,${logradouro.split(",").pop()}`, '').replace(/\d+\s+-\s+/g, '').trim(),
            "numero": logradouro.split(",").pop().replace(/\D/g, ''),
            "quadra": `${setor}/${quadra}`,
            "lote": lote,
            "bairro": getValue(arr, k.bairro).replace(/\W|\d/g, ''),
            "cep": `${cep.substring(0, 5)}-${cep.substring(5)}`,
            "cpf-cnpj": getValue(arr, k.cpf_cnpj)
        };

        for (key in obj)
            obj[key] = tryParseInt(obj[key]);
    } catch (e) {
        let { message, stack } = e;

        obj = { error: true, message, stack };
    }

    if (debug)
        obj.data = data;

    return obj;
};

let httpServer = require('http').createServer(app);
let io = require('socket.io')(httpServer, {
    // definindo tamanho máximo do buffer para 100mb. padrão 1mb (1e6)
    maxHttpBufferSize: 1e8
});

app.use(express.static('public'));

httpServer.listen(3000, function() {
    let host = httpServer.address().address
    let port = httpServer.address().port

    console.log('App listening at http://%s:%s', host, port)
});

io.on('connection', function(socket) {
    console.log('Client connected to the WebSocket');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('send_document', (buffer, debug) => {
        let options = { firstPage: 1, lastPage: 1 };

        pdfExtract.extractBuffer(buffer, options, (err, data) => {
            if (err) return { error: true, data: err };

            socket.emit('send_document', getJSON(data, debug));
        });
    });
});
