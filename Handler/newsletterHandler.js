const Newsletter = require("../models/Newsletter.js");


exports.handleNewsletterSubscription = async (req, res) => {
    const { email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    try {
        // Check if email already exists
        const existing = await Newsletter.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'Email already subscribed' });
        }

        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();
        res.status(200).json({ message: 'Subscribed successfully!' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}