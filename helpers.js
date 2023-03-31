const removeAccents = (text) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const tryParseInt = (value) => {
    if (!value) {
        return value;
    }

    if (!isNaN(value)) {
        return parseInt(value);
    }

    return value;
}

const getValue = (text) => {
    const find = `${text}:`.removeAccents().toLowerCase();

    let value = '';

    for (const i in data) {
        const text = data[i].str.removeAccents().toLowerCase();

        if (text.startsWith(find)) {
            const $value = data[parseInt(i) + 2].str;

            data = data.filter((_, j) => j > i);

            value = ($value.endsWith(':') ? '' : $value).trim();

            break;
        }
    }

    return value;
};

const getJSON = (array, debug) => {
    let obj = {};

    try {
        data = array.pages[0].content.filter((_, i) => i > 15);

        obj = {
            matricula: getValue('Matrícula'),
            logradouro: getValue('Logradouro').replace(/^[\d\s-]+/g, ''),
            bairro: getValue('Bairro ').replace(/\W|\d/g, ''),
            cep: getValue('CEP').replace(/[^\d]/g, ''),
            proprietario: getValue('Nome').replace(/[\d-]/g, '').trim(),
            cpfCnpj: getValue('CPF/CNPJ'),
            setor: getValue('Inscrição técnica: Setor'),
            quadra: getValue('Quadra'),
            lote: getValue('Lote'),
            quadraLoc: getValue('Localização: Quadra'),
            loteLoc: getValue('Lote')
        };

        obj.matricula = `${obj.matricula.slice(0, -1)}-${obj.matricula.slice(-1)}`;
        obj.cep = `${obj.cep.slice(0, 5)}-${obj.cep.slice(5)}`;

        const logradouro = obj.logradouro.replace(/^[\d\s-]+/g, '').split(',');
        const numero = logradouro.splice(1, 1).pop().trim();

        obj.logradouro = logradouro.join();
        obj.numero = numero;
    } catch (e) {
        const { message, stack } = e;

        obj = { error: true, message, stack };

        console.error(stack);
    }

    if (debug) {
        obj.data = data;
    }

    return obj;
};

String.prototype.removeAccents = function () { return removeAccents(this) };

module.exports = {
    removeAccents,
    tryParseInt,
    getValue,
    getJSON,
};