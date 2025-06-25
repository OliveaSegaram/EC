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
    console.log('Authorize middleware - Checking roles:', roles);
    console.log('User from request:', req.user);
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(403).json({ 
        message: `Forbidden: No user information found` 
      });
    }
    
    console.log('User role from token:', req.user.role);
    console.log('Required roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      console.log(`User role ${req.user.role} not in required roles:`, roles);
      return res.status(403).json({ 
        message: `Forbidden: Requires one of these roles: ${roles.join(', ')}` 
      });
    }
    
    console.log('User authorized with role:', req.user.role);
    next();
  };
};

module.exports = {
  protect,
  authorize
};
