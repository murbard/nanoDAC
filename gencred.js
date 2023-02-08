/* Generate credentials, the public and private pem files for the ED25519 ke
  as well as the http-authentication password file. */

const crypto = require('crypto');
const fs = require('fs');

const key = crypto.generateKeyPairSync('ed25519');

const privateKeyPem = key.privateKey.export({
    type: 'pkcs8',
    format: 'pem'
  });

  const publicKeyPem = key.publicKey.export({
    type: 'spki',
    format: 'pem'
  });

fs.writeFileSync('public.pem', publicKeyPem);
fs.writeFileSync('private.pem', privateKeyPem);

const password = 'changeme'
const username = 'user';
const htpasswd = `${username}:${password}\n`;

fs.writeFileSync('users.htpasswd', htpasswd);