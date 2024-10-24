const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Authentication middleware
const authMiddleware = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.userId)
        .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');
        
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      res.status(401).json({ message: 'Invalid token' });
    }
  };

  module.exports = authMiddleware;