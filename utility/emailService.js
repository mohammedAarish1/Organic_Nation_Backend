const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("../config/awsConfig");
const fs = require("fs");
const path = require("path");

async function sendEmail(to, subject, templateName, templateData) {
    const templatePath = path.join(__dirname, "emailTemplates", `${templateName}.html`);
    let htmlBody = fs.readFileSync(templatePath, "utf-8");

    // Replace placeholders in the template with actual data
    Object.keys(templateData).forEach(key => {
        const placeholder = `{{${key}}}`;
        htmlBody = htmlBody.replace(new RegExp(placeholder, "g"), templateData[key]);
    });

    const params = {
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: htmlBody,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: subject,
            },
        },
        Source: "info@organicnation.co.in", // Must be verified in SES
    };

    try {
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        // console.log("Email sent successfully:", result.MessageId);
        return result;
    } catch (error) {
        throw error;
    }
}

module.exports = { sendEmail };