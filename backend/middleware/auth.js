const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = {
      userId: decoded.userId, //need to be same in the token
      role: decoded.role
    };
    console.log('Auth middleware - User info:', req.user);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
};

// Middleware to check if user has required role(s)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: You don't have permission to perform this action` 
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
