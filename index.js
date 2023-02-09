/* Use the express framework and node.js to build a simple RPC server.
 * Authenticated users can call PUT to store blobs and GET to retrieve them by their content hash.
 * When a blob is retrieved, it is signed by the server to prove that it was stored by the server.
 * The signature used is an ECDSA signature over the hash of the blob using the ed25519 curve.
 * Use redis to store the blobs. */


const bodyParser = require('body-parser');
const fs = require('fs');
const tweetnacl = require('tweetnacl')
const blake = require('blakejs');
const basicAuth = require('express-basic-auth')


let secretKey = null;
// use crtypo to load pem private key and public key
// and create a tweetnacl secret key

const privateKeyPem = fs.readFileSync("private.pem", "utf-8");
const seed = Buffer.from(privateKeyPem.split('\n')[1],'base64').slice(-32)

// convert that entropy to a secret key
const keyPair = tweetnacl.sign.keyPair.fromSeed(seed);
secretKey = keyPair.secretKey;


// Express
const express = require('express');
const app = express();
app.use(bodyParser.json());

// Redis
const redis = require('redis');
const client = redis.createClient({ host: 'localhost', port: 6379, return_buffers: true});
client.connect();

app.use(basicAuth({
    users: {
        'admin': 'changeme'
    }}));

app.get('/:hash', async (req, res) => {
    /* Retrieve a blob by its hash in the redis database. The signature is the first 64 bytes of the blob. */
    var hash = req.params.hash;
    try {
        reply = await client.get(hash);
        reply = Buffer.from(reply, 'base64');
        var signature = reply.slice(0, 64);
        var blob = reply.slice(64);
        res.status(200).send({signature: signature.toString('hex'), data: blob.toString('base64')});
    } catch (err) {
        res.status(404).send('No data found.' + err);
    }
});

app.put('/', async (req, res) => {
    /* Store a blob in the redis database under its BLAKE-2B(256) hash.
       The signature is the first 64 bytes of the blob and uses the ed22519 curve. */
    try {
        var blob = Buffer.from(req.body.data, 'base64');
    }  catch (err) {
        console.log(req.body)
        return res.status(400).send('Invalid data.');
    }
    const hash = Buffer.from(blake.blake2b(blob, null, 32));
    const sig = Buffer.from(tweetnacl.sign.detached(hash, secretKey));
    blob = Buffer.concat([sig, blob]).toString('base64');
    const hex = hash.toString('hex');
    try {
        const reply = await client.set(hex, blob);
        res.status(200).send({hash: hex, signature: sig.toString('hex')});
    } catch (e) {
        res.status(500).send('Error storing data in database.');
    }});

const port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('Listening on port ' + port);
});


