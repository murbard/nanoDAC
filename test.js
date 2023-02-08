import fetch from 'node-fetch';
const tweetnacl = require('tweetnacl')
const blake = require('blakejs');
const fs = require('fs');


const publicKeyPem = fs.readFileSync("public.pem", "utf-8");
const publicKey = Buffer.from(publicKeyPem.split('\n')[1],'base64')

const message = "Hello World";
const hash = blake.blake2b(message, null, 32);


// Put the data, verify that the hash and signature are  correct

fetch('http://localhost:3000/put', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({data: Buffer.from(message).toString('base64')})
}).then(function(response) {
    return response.json();
}).then(function(data) {
    if (data.hash == hex) {
        console.log("Hash is correct.");
    } else {
        console.log("Hash is incorrect.");
    }
    if (tweetnacl.sign.detached.open(hash, data.signature, publicKey)) {
        console.log("Signature is correct.");
    } else {
        console.log("Signature is incorrect.");
    }
}).catch(function(err) {
    console.log(err);
});

// Get the data, verify that the signature is correct

fetch('http://localhost:3000/get/' + hex).then(function(response) {
    return response.json();
}).then(function(data) {
    if (tweetnacl.sign.detached.open(hash, data.signature, publicKey)) {
        console.log("Signature is correct.");
    } else {
        console.log("Signature is incorrect.");
    }
    console.log(data.data);
}).catch(function(err) {
    console.log(err);
});


