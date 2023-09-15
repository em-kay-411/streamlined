const express = require('express');
const passport = require('passport');

const router = express.Router();

// Middleware to authenticate the JWT token
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    
    // If authentication is successful, store the user in the request object
    req.user = user;
    next();
  })(req, res, next);
};

router.get('/dashboard', authenticateJWT, (req, res) => {
  res.json({ message: 'You have access to the manager dashboard.' });
});

module.exports = router;