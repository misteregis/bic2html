const express = require('express');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const { getJSON } = require('./helpers');

const pdfExtract = new PDFExtract();
const app = express();
const port = 3000;
const maxBufferSize = 1e8; // tamanho máximo do buffer: 100mb. padrão 1mb (1e6)

const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    maxHttpBufferSize: maxBufferSize
});

app.use(express.static('public'));

http.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});

io.on('connection', (socket) => {
    console.log('Client connected to the WebSocket');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('send_document', (buffer, debug) => {
        let options = { firstPage: 1, lastPage: 1 };

        pdfExtract.extractBuffer(buffer, options, (err, data) => {
            if (err) {
                return { error: true, data: err };
            }

            socket.emit('send_document', getJSON(data, debug));
        });
    });
});
