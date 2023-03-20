const express = require('express');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();
const webserver = express()
    .use((req, res) =>
        res.sendFile('/template.html', { root: __dirname })
    )
    .listen(8080, () => console.log(`Listening on ${8080}`));

const { WebSocketServer } = require('ws');
const sockserver = new WebSocketServer({ port: 3000 });

sockserver.on('connection', ws => {
    console.log('New client connected!')
    ws.send('connection established')
    ws.on('close', () => console.log('Client has disconnected!'))
    ws.on('message', buffer => {
        sockserver.clients.forEach(client => {
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

                client.send(JSON.stringify(obj));
            });
        })
    })
    ws.onerror = function () {
        console.log('websocket error')
    }
});
