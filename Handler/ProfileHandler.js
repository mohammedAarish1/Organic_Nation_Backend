const User = require("../models/User");
const PinCode = require('../models/PinCode');
const { address, removeExtraSpaces, verifyOTP } = require("../utility/helper");
const { default: mongoose } = require("mongoose");


// add new address
exports.addNewAddress = async (req, res) => {
    const userId = req.user.id;
    const newAddress = req.body;
    try {
        // Validate incoming data
        const requiredFields = ['mainAddress', 'city', 'state', 'pinCode', 'addressType'];
        for (const field of requiredFields) {
            if (!newAddress[field]) {
                return res.status(400).json({ error: `${field} is required` });
            }
        }

        const pinCodeData = await PinCode.findOne({ pinCode: newAddress.pinCode })

        if (!pinCodeData) {
            return res.status(400).json({ error: 'Invalid PinCode' });
        }


        if (pinCodeData.city.trim().toLowerCase() !== newAddress.city.trim().toLowerCase() || pinCodeData.state.trim().toLowerCase() !== newAddress.state.trim().toLowerCase()) {
            return res.status(400).json({ error: 'Invalid City or State' });
        }


        // Find user and update addresses
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }


        const isAddressAlreadyExist = user.addresses.some(address => address.pinCode.trim() === newAddress.pinCode.trim() || address.addressType.trim().toLowerCase() === newAddress.addressType.trim().toLowerCase());


        if (isAddressAlreadyExist) {
            return res.status(400).json({ error: 'Address with same  PinCode or Address Type already exist' });

        }

        // Add new address to the user's addresses array
        user.addresses.push(newAddress);
        await user.save();

        return res.status(201).json({ message: 'New Address added successfully' });
    } catch (error) {
        console.error('Error adding address:', error);
        return res.status(500).json({ error: 'An error occurred while adding the address' });
    }
}



// delete address
exports.deleteAddress = async (req, res) => {
    const { addressId } = req.params;
    const userId = req.user.id;

    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find and remove the address
        const addressIndex = user.addresses.findIndex(address => address._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Remove the address from the user's addresses array
        user.addresses.splice(addressIndex, 1);
        await user.save();

        return res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        return res.status(500).json({ error: 'An error occurred while deleting the address' });
    }
}


// edit existing address
exports.updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user.id;
        const updates = req.body;
        // Validate ObjectIds
        // if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(addressId)) {
        //     return res.status(400).json({ message: 'Invalid ID format' });
        // }

        // Find user and the specific address
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const addressIndex = user.addresses.findIndex(
            addr => addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Address not found' });
        }

        const currentAddress = user.addresses[addressIndex];

        // Check if there are any changes
        const hasChanges = Object.keys(updates).some(
            key => updates[key] !== currentAddress[key]
        );

        if (!hasChanges) {
            return res.status(200).json({
                message: 'No changes detected',
                address: currentAddress
            });
        }

        // If pinCode is being updated, check if it exists in another address
        if (updates.pinCode && updates.pinCode !== currentAddress.pinCode) {
            const pinCodeExists = user.addresses.some(
                addr => addr.pinCode === updates.pinCode &&
                    addr._id.toString() !== addressId
            );

            if (pinCodeExists) {
                return res.status(400).json({
                    error: 'This pinCode is already used in another address'
                });
            }
        }

        // If addressType is being updated, check if it exists in another address
        if (updates.addressType && updates.addressType !== currentAddress.addressType) {
            const addressTypeExists = user.addresses.some(
                addr => addr.addressType.toLowerCase() === updates.addressType.toLowerCase() &&
                    addr._id.toString() !== addressId
            );
            if (addressTypeExists) {
                return res.status(400).json({
                    error: 'This address type already exists'
                });
            }
        }

        // If city, state, or pinCode is changed, validate against PinCode collection
        if (updates.city || updates.state || updates.pinCode) {
            const pinCodeToCheck = updates.pinCode || currentAddress.pinCode;
            const cityToCheck = updates.city || currentAddress.city;
            const stateToCheck = updates.state || currentAddress.state;

            const validPinCode = await PinCode.findOne({
                pinCode: pinCodeToCheck,
                city: cityToCheck,
                state: stateToCheck
            });

            if (!validPinCode) {
                return res.status(400).json({
                    error: 'Invalid combination of city, state and pinCode'
                });
            }
        }

        // Update the address
        Object.keys(updates).forEach(key => {
            user.addresses[addressIndex][key] = updates[key];
        });

        await user.save();

        return res.status(200).json({
            message: 'Address updated successfully',
            address: user.addresses[addressIndex]
        });

    } catch (error) {
        console.error('Error in editUserAddress:', error);
        return res.status(500).json({
            message: 'Server error while updating address',
            error: error.message
        });
    }
};



// update personal info
exports.updatePersonalInfo = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user.id;
        let updates = req.body;
        updates = removeExtraSpaces(updates)
        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if there are any updates
        const allowedUpdates = ['firstName', 'lastName', 'email', 'phoneNumber'];
        const isValidOperation = Object.keys(updates).every(update =>
            allowedUpdates.includes(update)
        );

        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates!' });
        }

        // If no valid updates provided
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No updates provided' });
        }

        // Check if anything is actually changing
        const hasChanges = Object.keys(updates).some(
            key => updates[key] !== user[key]
        );

        if (!hasChanges) {
            return res.status(200).json({
                message: 'No changes detected',
                user: user
            });
        }

        // Validate email format if email is being updated
        if (updates.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updates.email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            // Check if email already exists for another user
            const emailExists = await User.findOne({
                email: updates.email,
                _id: { $ne: userId }
            });

            if (emailExists) {
                return res.status(400).json({ error: 'Email already exist' });
            }
        }

        // If phone number is being updated
        if (updates.phoneNumber !== user.phoneNumber) {
            // Check if phone number is already in use by another user
            const phoneExists = await User.findOne({
                phoneNumber: updates.phoneNumber,
                _id: { $ne: userId }
            });

            if (phoneExists) {
                return res.status(400).json({ error: 'Phone number already exists' });
            }

            // Return early with pending status if phone number is being updated
            // Client needs to complete OTP verification flow
            return res.status(202).json({
                message: 'requiresOTP',
                // pendingUpdates: updates,
                // requiresOTP: true
            });
        }

        // Apply updates (excluding phone number which requires OTP)
        Object.keys(updates).forEach(key => {
            if (key !== 'phoneNumber') {
                user[key] = updates[key];
            }
        });

        await user.save({ session });
        await session.commitTransaction();

        return res.status(200).json({ message: 'Updated successfully' });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in updatePersonalInfo:', error);
        return res.status(500).json({
            message: 'Server error while updating personal information',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// update phone number
exports.updatePhoneNumber = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { newPhoneNumber, otp } = req.body;
        const userId=req.user?.id


        const isValid = await verifyOTP(newPhoneNumber, otp);


        if (!isValid) {
            return res.status(400).json({ message: 'OTP verification required' });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update phone number
        user.phoneNumber = newPhoneNumber;
        await user.save({ session });
        await session.commitTransaction();

        return res.status(200).json({ message: 'Phone number updated successfully' });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in completePhoneUpdate:', error);
        return res.status(500).json({
            message: 'Server error while updating phone number',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};