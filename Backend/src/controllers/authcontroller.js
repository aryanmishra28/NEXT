// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const User = require('../models/user');
// require('dotenv').config();

// // Register a new user
// const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // Validate input
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required'
//       });
//     }

//     const normalizedEmail = String(email).trim().toLowerCase();

//     // Check if user already exists
//     const existingUser = await User.findOne({ email: normalizedEmail });
//     if (existingUser) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'User already exists' 
//       });
//     }

//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create user
//     const user = await User.create({ 
//       name, 
//       email: normalizedEmail, 
//       password: hashedPassword 
//     });

//     // Generate JWT token
//     if (!process.env.JWT_SECRET) {
//       console.error('JWT_SECRET is not defined in .env file!');
//       return res.status(500).json({
//         success: false,
//         message: 'Server configuration error. Please contact administrator.'
//       });
//     }
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     // Set cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax'
//     });

//     res.status(201).json({ 
//       success: true,
//       message: 'User registered successfully',
//       token,
//       user: {
//         id: user._id.toString(),
//         email: user.email,
//         name: user.name
//       }
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Something went wrong', 
//       error: error.message 
//     });
//   }
// };

// // Login user
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validate input
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email and password are required'
//       });
//     }

//     const normalizedEmail = String(email).trim().toLowerCase();

//     // Find user
//     const user = await User.findOne({ email: normalizedEmail });
//     if (!user) {
//       console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Check if user has a password (OAuth users might not have one)
//     if (!user.password) {
//       console.log(`Login attempt failed: User ${normalizedEmail} was created with Google OAuth`);
//       return res.status(400).json({
//         success: false,
//         message: 'This account was created with Google. Please sign in with Google instead.' 
//       });
//     }

//     // Compare password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       console.log(`Login attempt failed: Incorrect password for email: ${normalizedEmail}`);
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     console.log(`Login successful for user: ${normalizedEmail}`);

//     // Generate JWT token
//     if (!process.env.JWT_SECRET) {
//       console.error('JWT_SECRET is not defined in .env file!');
//       return res.status(500).json({
//         success: false,
//         message: 'Server configuration error. Please contact administrator.'
//       });
//     }
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     // Set cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax'
//     });

//     res.json({
//       success: true,
//       message: 'Logged in successfully',
//       token,
//       user: {
//         id: user._id.toString(),
//         email: user.email,
//         name: user.name
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Something went wrong',
//       error: error.message
//     });
//   }
// };

// // Logout user
// const logout = async (req, res) => {
//   try {
//     res.clearCookie("token");
//     res.json({
//       success: true,
//       message: 'Logged out successfully'
//     });
//   } catch (error) {
//     console.error('Logout error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Something went wrong'
//     });
//   }
// };

// // Google OAuth login (accepts idToken OR credential)
// const googleLogin = async (req, res) => {
//   try {
//     // Accept either "idToken" or "credential"
//     const idToken = req.body.idToken || req.body.credential;
//     if (!idToken) {
//       return res.status(400).json({
//         success: false,
//         message: 'ID token is required'
//       });
//     }

//     // Use global.fetch if available (Node 18+), otherwise node-fetch
//     let fetchFn = global.fetch;
//     if (!fetchFn) {
//       fetchFn = require('node-fetch');
//     }

//     const googleResponse = await fetchFn(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
//     const googleData = await googleResponse.json();

//     if (!googleResponse.ok || googleData.error) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid Google token'
//       });
//     }

//     // Extract user info from Google
//     const { email, name, picture, sub: googleId } = googleData;
//     const normalizedEmail = String(email).trim().toLowerCase();

//     // Check if user exists
//     let user = await User.findOne({
//       $or: [
//         { email: normalizedEmail },
//         { googleId: googleId }
//       ]
//     });

//     if (!user) {
//       // Create new user with Google OAuth
//       user = await User.create({
//         name: name || email.split('@')[0],
//         email: normalizedEmail,
//         googleId: googleId,
//         picture: picture,
//         provider: 'google',
//         password: undefined // No password for OAuth users
//       });
//     } else {
//       // Update existing user with Google info if needed
//       if (!user.googleId) {
//         user.googleId = googleId;
//         user.provider = 'google';
//         if (!user.picture && picture) {
//           user.picture = picture;
//         }
//         await user.save();
//       }
//     }

//     // Generate JWT token
//     if (!process.env.JWT_SECRET) {
//       console.error('JWT_SECRET is not defined in .env file!');
//       return res.status(500).json({
//         success: false,
//         message: 'Server configuration error. Please contact administrator.'
//       });
//     }
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     // Set cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax'
//     });

//     res.json({
//       success: true,
//       message: 'Logged in successfully with Google',
//       token,
//       user: {
//         id: user._id.toString(),
//         email: user.email,
//         name: user.name,
//         picture: user.picture
//       }
//     });
//   } catch (error) {
//     console.error('Google login error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Something went wrong', 
//       error: error.message 
//     });
//   }
// };

// // Me endpoint - returns current user based on token cookie
// const me = async (req, res) => {
//   try {
//     const token = req.cookies?.token;
//     if (!token) {
//       return res.status(200).json({ user: null });
//     }

//     if (!process.env.JWT_SECRET) {
//       console.error('JWT_SECRET is not defined in .env file!');
//       return res.status(500).json({ message: 'Server configuration error' });
//     }

//     let payload;
//     try {
//       payload = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       // token invalid/expired
//       return res.status(200).json({ user: null });
//     }

//     const user = await User.findById(payload.userId).lean();
//     if (!user) {
//       return res.status(200).json({ user: null });
//     }

//     return res.json({
//       user: {
//         id: user._id.toString(),
//         name: user.name,
//         email: user.email,
//         picture: user.picture || null
//       },
//     });
//   } catch (err) {
//     console.error('me error', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// module.exports = {
//   register,
//   login,
//   logout,
//   googleLogin,
//   me
// };


// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword
    });

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in .env file!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact administrator.'
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      console.log(`Login attempt failed: User ${normalizedEmail} was created with Google OAuth`);
      return res.status(400).json({
        success: false,
        message: 'This account was created with Google. Please sign in with Google instead.'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login attempt failed: Incorrect password for email: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log(`Login successful for user: ${normalizedEmail}`);

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in .env file!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact administrator.'
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
};

// Google OAuth login (accepts idToken OR credential)
const googleLogin = async (req, res) => {
  try {
    // Accept either "idToken" or "credential"
    const idToken = req.body.idToken || req.body.credential;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Use global.fetch if available (Node 18+), otherwise node-fetch
    let fetchFn = global.fetch;
    if (!fetchFn) {
      fetchFn = require('node-fetch');
    }

    const googleResponse = await fetchFn(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const googleData = await googleResponse.json();

    if (!googleResponse.ok || googleData.error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    // Extract user info from Google
    const { email, name, picture, sub: googleId } = googleData;
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { googleId: googleId }
      ]
    });

    if (!user) {
      // Create new user with Google OAuth
      user = await User.create({
        name: name || email.split('@')[0],
        email: normalizedEmail,
        googleId: googleId,
        picture: picture,
        provider: 'google',
        password: undefined // No password for OAuth users
      });
    } else {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        if (!user.picture && picture) {
          user.picture = picture;
        }
        await user.save();
      }
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in .env file!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact administrator.'
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: 'Logged in successfully with Google',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: error.message
    });
  }
};

//  me (simple)
const me = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(200).json({ success: true, user: null });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET missing');
      return res.status(500).json({ success: false, message: 'Server misconfiguration' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      res.clearCookie('token');
      return res.status(200).json({ success: true, user: null });
    }

    // exclude sensitive fields
    const user = await User.findById(payload.userId).select('-password -__v').lean();
    if (!user) {
      res.clearCookie('token');
      return res.status(200).json({ success: true, user: null });
    }

    // Ensure these fields exist on the user model (fallbacks provided)
    const responseUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      picture: user.picture || null,
      resumeScore: user.resumeScore ?? null,
      applicationsCount: user.applicationsCount ?? null,
      hackathonsCount: user.hackathonsCount ?? null,
      connectionsCount: user.connectionsCount ?? null,
      // optionally include small recentActivity array stored on user
      recentActivity: user.recentActivity ?? [],
      upcomingEvents: user.upcomingEvents ?? []
    };

    return res.json({ success: true, user: responseUser });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  register,
  login,
  logout,
  googleLogin,
  me
};
