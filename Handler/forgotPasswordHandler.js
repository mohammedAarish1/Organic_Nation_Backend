const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require("../utility/emailService");


exports.getEmailVerified = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a JWT token for password reset
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Save the hashed reset token to the user document
        const salt = await bcrypt.genSalt(10);
        const hashedToken = await bcrypt.hash(resetToken, salt);
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create the reset password link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Send email using AWS SES (same as before)
        await sendEmail(
            email,
            "Reset Password",
            "passwordResetLink",
            {
                userName: user.fullName,
                link: resetLink,
                // Add more template variables as needed
            }
        );


        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }



        // Check if the token matches and hasn't expired
        const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isValidToken || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
}
