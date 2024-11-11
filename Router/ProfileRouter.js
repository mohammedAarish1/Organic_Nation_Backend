const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware.js");

const {
    addNewAddress,
    deleteAddress,
    updateAddress,
    updatePersonalInfo,
    updatePhoneNumber
} = require("../Handler/ProfileHandler.js");

router.post("/add/address", authMiddleware, addNewAddress);
router.delete("/delete/address/:addressId", authMiddleware, deleteAddress);
router.put("/update/address/:addressId", authMiddleware, updateAddress);
router.put("/update/peronal/info", authMiddleware, updatePersonalInfo);
router.put("/update/peronal/phone-number", authMiddleware, updatePhoneNumber);



module.exports = router;
