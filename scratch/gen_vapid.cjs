const crypto = require('crypto');

function generateVapidKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });

  const encode = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  // Extracting the raw public/private keys for VAPID
  const pubRaw = publicKey.export({ type: 'spki', format: 'der' }).subarray(-65);
  const privRaw = privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(-32);

  return {
    publicKey: encode(pubRaw),
    privateKey: encode(privRaw)
  };
}

const keys = generateVapidKeys();
console.log('---VAPID_START---');
console.log('VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('---VAPID_END---');
