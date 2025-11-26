const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

// CONFIGURATION
const SERVICE_ACCOUNT_EMAIL = 'firebase-adminsdk-xxx@trunkchina-97cd2.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsMSnnou3icOsJ\nnaNUPJ40tehf9fXSsieDkDWK4YWSvbTuOufNVgedLzRgXXw2EDMvWB5AozVHoEXN\nv9ismoTQ4rLZY2Rjp9Vnpxcwc0MGmnBkS/PJQ1AiOimkBCbTxo1ul/He5yPtMJRj\nEhvrJjGNMOVZ7FUl2dpoM47o636fZCSujXm3p/bgPS+Je6RooYf5Iu4dqZWr7y1T\nKtoZrwD0yqAautv+6Ke4M5BYZ68f6KX63cZ06PhLoszZ7mJI4wY3535ja/+CCznT\nJSvO8o4p7AvhPDkDcum7TyeKS2MSsRv8R38Hfwh7S/NhGU4ZMCUS7Unxkh7aTk21\nJeef33UTAgMBAAECggEAEFmSDTdjF24PCziHd9SnqwFIzBp6hHk7wkTGU2Zq5048\naKXO49LoNyxycIyqjNGd9+q0jgD76qNVGB5qxaeIYUiH9eyiQsopZnBZsH/enI5m\nifIiTE59bzqO607PnFU35wk7bfsMO2sySR6WPbjrLz5g0K3dlJH/0zFuFOoOJGEs\nhpPvj0uafatIr7cojP3SRdftG5/w6hQ++zT3oFjPdfwXTQALMfxs3SnypvdjlBcy\nwKeICnxNRko3FFKoHdGq73A0uCWJeU99g6v0hCNVYVxdLkE6m3aCoaL3fqQ57rwd\nRM+Woaa/3+03zx7xI+hhv5odZI3NYbMtfWn0ZTH5wQKBgQDS0hqa0oardcys/q5Y\n8Qrz8EKzYTmbNJM6kv/H5DbPXVAU+fHYLqblT7dl3Bj8bGhq6d+ZSaTV94Myz8xm\nh4Z3pvcNQRVHkfKiGXT72Kx9F46QBM7miSJeNHIjXOC+LVFF/JwtSy2kQGtgGaPn\niyo/2PyBOFzKtKiqsd2wzBydQQKBgQDRF9dOMYZlKhEGnI2ISqR3J8GP/MGFUNb8\nL+WDIr1//Xrxb8HwFhJDktFYNwOlMdxxZzHG7LUTre4OLgRDW8Hu3GVN0M/HOisA\nrXGfBq/6UiJNzuAh8Jc7OYLv/o6muK6VE++a8GsU5naj2BlliFFKIjdIUoEMHqhn\n5H+ynVU5UwKBgQC0J59clnNGqk/RtYG/t5wogTQ+neLgYrk94Mh7ROYhphf9FOo6\nVwOACfMrND6V1v4T/u94ypn1zqFrFnARXdbnAOM1jFxm4K17IE37uVkNPMgzAijc\nkGuyHRc8aO4VFhzRteCwRAIoznPzl3WdNCtSjFabBlMlVeScmYpcvs/lAQKBgACc\n0USpYHtrZCFg1AlSLqkqtKZ3VxnM4tRaT5HSyDtXwsRyT18ksWkBRRu9DYWuX7b1\nVm/+wYkNOWVRPTH1UtwgSSuxMOqkgPu/hlWw71MMao1PzdhLnCXQRVHurPxQDjLh\nnBIYIjgtdKuGNozVmWdeMktD8pzWeifTw4wCaf2BAoGBAIhBS1a5UnCdFfmxRJ5V\ntW1K0eXQB7Fx9KOACTA9y6nTxeHSqCHXAZjuJHVdRLnP6nm8j9kK7qcAzsAkLnkf\nPuwzRK3vx+8CicuakLssnSGZzQQVEn4Uz4Vu54O4OiB9JLJH9YjziMULB3E4SGKc\nJiGcrY3p4xPMkTlrIovNMDaa\n-----END PRIVATE KEY-----\n`;
const PROJECT_ID = 'trunkchina-97cd2';

// Générer l'access token
async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: SERVICE_ACCOUNT_EMAIL,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
    };

    const token = jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });

    const res = await axios.post('https://oauth2.googleapis.com/token', 
        `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return res.data.access_token;
}

// Endpoint pour Salesforce
app.post('/send-fcm', async (req, res) => {
    try {
        const { deviceToken, title, body } = req.body;
        const accessToken = await getAccessToken();

        const fcmRes = await axios.post(
            `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
            {
                message: {
                    token: deviceToken,
                    notification: { title, body }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ success: true, fcmResponse: fcmRes.data });
    } catch (err) {
        console.error(err.response?.data || err);
        res.status(500).json({ success: false, error: err.response?.data || err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FCM middleware running on port ${PORT}`));

