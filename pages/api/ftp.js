const fs = require('fs');
const Client = require('ftp');
const openpgp = require('openpgp');

export default async function handler(req, res) {
    // connect to an ftp server and fetch the file
    let dmc = "COSMO";
    let today = new Date();
    let dd = today.getDate()-1;
    let mm = today.getMonth() + 1; //January is 0
    let yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    today = yyyy + '-' + mm + '-' + dd;
    let filename = dmc + '_' + today + '.' + 'gpg';
    const ftp = new Client();
    ftp.on('ready', function() {
        ftp.get(`/${filename}`, function(err, stream) {
          if (err) throw err;
          stream.once('close', function() { ftp.end(); });
          stream.pipe(fs.createWriteStream(`${filename.split(".")[0]}-copy.gpg`));
        });
      });
    ftp.connect({
        host: 'ezy-sftp.atcoretec.com',
        user: 'dmc_cosmo',
        password: '~f0q/ugRR*K]'
    });
    ftp.on('error', function(err) {  console.log(err); return res.status(400).json({ error: err }); }
    );
    try {
      const pgpMessage = fs.readFileSync(`${filename.split(".")[0]}-copy.gpg`, 'utf8');
    } catch (error) {
      return res.status(400).json({ error: error });
    }
    const publicKeyArmored = `${process.env.PUBLIC_KEY}`;
    const privateKeyArmored = `${process.env.PRIVATE_KEY}`;

    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
    const privateKey = await openpgp.readKey({ armoredKey: privateKeyArmored });

    const { data: decrypted, signatures } = await openpgp.decrypt({
      pgpMessage,
      verificationKeys: publicKey, // optional
      decryptionKeys: privateKey
    });
    console.log(decrypted);
    try {
      await signatures[0].verified; // throws on invalid signature
      console.log('Signature is valid');
    } catch (e) {
      return res.status(400).json({ error: 'Signature could not be verified' });
    }
    return res.status(200).json({ message: 'Signature is valid', decrypted });
  }