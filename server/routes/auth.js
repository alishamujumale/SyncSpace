const express = require('express');
const passport = require('passport');
const router = express.Router();

// Step 1: Redirect user to Google's login page
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Step 2: Google redirects back here after login
router.get('/google/callback', (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  passport.authenticate('google', { failureRedirect: `${clientUrl}/?error=auth_failed` }, (err, user) => {
    if (err) {
      console.error('Google auth callback error:', err);
      return res.redirect(`${clientUrl}/?error=server_error`);
    }
    if (!user) {
      return res.redirect(`${clientUrl}/?error=auth_failed`);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Passport login error:', loginErr);
        return res.redirect(`${clientUrl}/?error=server_error`);
      }
      return res.redirect(`${clientUrl}/dashboard`);
    });
  })(req, res, next);
});

// Get currently logged in user
router.get('/me', (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ user: null });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;