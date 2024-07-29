// awsConfig.js
const { SNSClient } = require("@aws-sdk/client-sns");
const { SESClient } = require("@aws-sdk/client-ses");


const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});


const sesClient = new SESClient({
    region: process.env.AWS_REGION, // e.g., "us-east-1"
});


module.exports = { snsClient, sesClient };