let obj = {
    a : 'value1',
    b : 'value2',
    c : 'value3'
}

console.log(Buffer.from('buffer:' + JSON.stringify(obj)));

let data = Buffer.from(JSON.stringify(obj));

console.log('data:',JSON.parse(data.toString()));
