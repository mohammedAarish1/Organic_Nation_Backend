// for NEXT JS
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddlewareNew = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.status(401).json({ message: "Authentication required",code:'TOKEN_EXPIRED' });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ code: "TOKEN_EXPIRED" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddlewareNew;
