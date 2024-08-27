const ContactedUser = require('../models/ContactedUser');
const { sendEmail } = require("../utility/emailService");


exports.saveContactedUser= async (req, res) => {
    try {
        const { fullName, email, phoneNumber, city } = req.body;

        // Create a new contact document
        const newContact = new ContactedUser({
            fullName,
            email,
            phoneNumber,
            city
        });

        // Save the contact to the database
        await newContact.save();
        if (email) {
            await sendEmail(
                email,
                "Organic Nation - Contact Request Submitted",
                "userQueryConfirmation",
                {
                    userName: fullName,
                    // Add more template variables as needed
                }
            );
        }

        res.status(201).json({ message: 'Contact Details submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting contact form' });
    }
}


