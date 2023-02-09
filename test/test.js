const axios = require('axios');
const tweetnacl = require('tweetnacl')
const blake = require('blakejs');
const fs = require('fs');

const publicKeyPem = fs.readFileSync("public.pem", "utf-8");
const publicKey = Buffer.from(publicKeyPem.split('\n')[1],'base64').slice(-32)

const message = "Hello World";
const hash = blake.blake2b(message, null, 32);
const hex_hash = Buffer.from(hash).toString('hex');

test('Put', async () => {
    const res = await axios.put('http://admin:changeme@localhost:3000',
        {data: Buffer.from(message).toString('base64')});
        expect(res.status).toEqual(200);
        expect(res.data.hash).toEqual(hex_hash);
        const sig = Buffer.from(res.data.signature, 'hex');
        expect(tweetnacl.sign.detached.verify(hash, sig, publicKey)).toEqual(true);
});

test('Get', async () => {
    const res = await axios.get('http://admin:changeme@localhost:3000/' + hex_hash);
    expect(res.status).toEqual(200);
    expect(Buffer.from(res.data.data, 'base64').toString()).toEqual(message);
    const sig = Buffer.from(res.data.signature, 'hex');
    expect(tweetnacl.sign.detached.verify(hash, sig, publicKey)).toEqual(true);

});

test('Get x1000', async () => {
    let promises = [];
    for (let i = 0; i < 1000; i++) {
        const res = await axios.get('http://admin:changeme@localhost:3000/' + hex_hash);
        promises.push(res)
    }
    let results = await Promise.all(promises);
    for (let i = 0; i < 1000; i++) {
        expect(results[i].status).toEqual(200);
    }
});

test('Put x100', async () => {
    // array of promises
    let promises = [];
    for (let i = 0; i < 100; i++) {
        let message = "Hello World " + i;

        let res =  axios.put('http://admin:changeme@localhost:3000',
            {data: Buffer.from(message).toString('base64')});
        // append res to array of promises
        promises.push(res);
    }
    // wait for all promises to resolve
    let results = await Promise.all(promises);
    // check results
    for (let i = 0; i < 100; i++) {
        expect(results[i].status).toEqual(200);
    }
});
