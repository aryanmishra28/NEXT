// src/routes/auth.js
const express = require('express');
const router = express.Router();

// Adjust path as needed to match your controllers directory
const authController = require('../controllers/authController');

// Basic validation helper
function mustBeFunction(fn, name) {
  if (typeof fn !== 'function') {
    const msg = `Auth route setup error: expected "${name}" to be a function but got ${typeof fn}.`;
    console.error(msg, '\nExported object from controllers/authController:', authController);
    throw new TypeError(msg);
  }
}

// Ensure authController loaded
if (!authController || typeof authController !== 'object') {
  console.error('Failed to load authController. Received:', authController);
  throw new Error('authController not found or invalid. Check the require path and module.exports in controllers/authController.js');
}

// Register routes (only if they are functions)
if (authController.register) {
  mustBeFunction(authController.register, 'register');
  router.post('/register', authController.register);
}

if (authController.login) {
  mustBeFunction(authController.login, 'login');
  router.post('/login', authController.login);
}

if (authController.googleLogin) {
  mustBeFunction(authController.googleLogin, 'googleLogin');
  router.post('/google', authController.googleLogin);
}

if (authController.logout) {
  mustBeFunction(authController.logout, 'logout');
  router.post('/logout', authController.logout);
}

// /me is a GET endpoint that returns the current user
if (authController.me) {
  mustBeFunction(authController.me, 'me');
  router.get('/me', authController.me);
}

// Export the router
module.exports = router;
