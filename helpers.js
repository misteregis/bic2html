const tryParseInt = (value) => {
    if (!value) {
        return value;
    }

    if (!isNaN(value)) {
        return parseInt(value);
    }

    return value;
}

const getValue = (data, key, keys = []) => {
    let value = data[key].str;

    for (const k of keys) {
        if (!value.match(/\d/g)) {
            value = getValue(data, k);
        } else {
            break;
        }
    }

    return value;
};

const getJSON = (data, debug) => {
    let obj = {};
    let keys = {
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
        const arr = data.pages[0].content;

        if (!arr.find(x => x.str === 'Matrícula :')) {
            keys.logradouro = 24;
            keys.setor = 65;
            keys.quadra = 69;
            keys.lote = 73;
            keys.bairro = 28;
            keys.cep = 49;
            keys.cpf_cnpj = 41;
        }

        const matricula = getValue(arr, keys.matricula);
        const logradouro = getValue(arr, keys.logradouro);
        const cep = getValue(arr, keys.cep).replace(/\D/g, '');
        const setor = getValue(arr, keys.setor, [ 77 ]).slice(-3);
        const quadra = getValue(arr, keys.quadra, [ 81 ]).slice(-3);
        const lote = getValue(arr, keys.lote, [ 85 ]);

        obj = {
            "matricula": `${matricula.slice(0, -1)}-${matricula.slice(-1)}`,
            "logradouro": logradouro.replace(`,${logradouro.split(",").pop()}`, '').replace(/\d+\s+-\s+/g, '').trim(),
            "numero": logradouro.split(",").pop().replace(/\D/g, ''),
            "quadra": `${setor}/${quadra}`,
            "lote": lote,
            "bairro": getValue(arr, keys.bairro).replace(/\W|\d/g, ''),
            "cep": `${cep.substring(0, 5)}-${cep.substring(5)}`,
            "cpf-cnpj": getValue(arr, keys.cpf_cnpj)
        };

        for (const key in obj) {
            obj[key] = tryParseInt(obj[key]);
        }
    } catch (e) {
        const { message, stack } = e;

        obj = { error: true, message, stack };
    }

    if (debug) {
        obj.data = data;
    }

    return obj;
};

module.exports = {
    tryParseInt,
    getValue,
    getJSON,
};