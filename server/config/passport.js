const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

const normalizeUrl = (value, fallback) => {
  if (!value) return fallback;
  const trimmed = value.trim().replace(/\/$/, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const defaultPort = process.env.PORT || 10000;
const defaultCallback = `http://localhost:${defaultPort}/auth/google/callback`;
const callbackURL = normalizeUrl(process.env.GOOGLE_CALLBACK_URL, defaultCallback);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const avatar = profile.photos?.[0]?.value;
      const name = profile.displayName || 'Google User';

      if (!email) {
        return done(new Error('Google profile is missing an email address'), null);
      }

      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email });
      }

      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      user = await User.create({
        googleId: profile.id,
        name,
        email,
        avatar
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});