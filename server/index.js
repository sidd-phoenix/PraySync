import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
dotenv.config();
const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true, // Allow cookies if needed
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Google OAuth client
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);


/*  -------------------------------------------------------- */

// Database connection

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// }).promise();

// PostgreSQL connection pool
const pgPool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: 5432, // Default PostgreSQL port
  ssl: {
    require: true,
  }
});

/*  -------------------------------------------------------- */

app.get('/', (req, res) => {
  res.json('Server is running.')
})

/*  -------------------------------------------------------- */

// Auth endpoints
app.get("/auth/user", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your actual secret key
    res.json({
      name: decoded.name,
      email: decoded.email,
      picture: decoded.profile_pic,
      role: decoded.role,
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// Redirect to Google for authentication
app.get('/auth/google', (req, res) => {
  const scopes = [
    'profile openid email'
  ];

  const redirectUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  // Redirects frontend to Google for authentication
  res.redirect(redirectUrl);
});

// Handle the callback from Google
app.get('/auth/google/callback', async (req, res) => {
  console.log("callback");
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const { tokens } = await client.getToken(code); // Ensure this is awaited
    if (!tokens || !tokens.id_token) {
      throw new Error("No tokens received or id_token is missing");
    }
    client.setCredentials(tokens);

    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists in PostgreSQL database
    const { rows: users } = await pgPool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    let user;
    if (users.length === 0) {
      // Create new user
      await pgPool.query(
        'INSERT INTO users (email, name, profile_pic, role) VALUES ($1, $2, $3, $4)',
        [email, name, picture, 'viewer']
      );

      user = { email, name, profile_pic: picture, role: 'viewer' };
    } else {
      // Update existing user information
      await pgPool.query(
        'UPDATE users SET name = $1, profile_pic = $2 WHERE email = $3',
        [name, picture, email]
      );

      user = users[0]; // Get the existing user
    }

    const jwtToken = jwt.sign(
      user,
      process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Store token in cookies
    res.cookie("token", jwtToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', // Set to true in production
      sameSite: 'none', // Adjust as necessary
    });

    res.redirect(process.env.CLIENT_URL);

  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).send("Authentication failed");
  }
});

// // mysql DB used
// app.post('/auth/google', async (req, res) => {
//   try {
//     const { credential } = req.body;

//     // Verify Google token
//     const ticket = await client.verifyIdToken({
//       idToken: credential,
//       audience: process.env.GOOGLE_CLIENT_ID
//     });

//     const payload = ticket.getPayload();
//     const { email, name, picture } = payload;

//     // Check if user exists in database
//     const [users] = await pool.query(
//       'SELECT * FROM users WHERE email = ?',
//       [email]
//     );

//     let user;
//     if (users.length === 0) {
//       // Create new user
//       const [result] = await pool.query(
//         'INSERT INTO users (email, name, profile_pic, role) VALUES (?, ?, ?, ?)',
//         [email, name, picture, 'viewer']
//       );

//       user = {
//         email,
//         name,
//         profile_pic: picture,
//         role: 'viewer'
//       };
//     } else {
//       // Update existing user information
//       const [result] = await pool.query(
//         'UPDATE users SET name = ?, profile_pic = ? WHERE email = ?',
//         [name, picture, email]
//       );

//       user = users[0]; // Get the existing user
//     }

//     res.json({ user });
//   } catch (error) {
//     console.error('Google auth error:', error);
//     res.status(401).json({ error: 'Authentication failed' });
//   }
// });

app.post('/auth/logout', (req, res) => {
  res.clearCookie("token", { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', // Match the secure setting
    sameSite: 'none', // Match the sameSite setting
    path: '/' // Specify the path if necessary
  });
  res.json({ message: "Logged out successfully" });
});


/*  -------------------------------------------------------- */
// POSTGRES ENDPOINTS

// Test PostgreSQL connection
async function testPgConnection() {
  try {
    const client = await pgPool.connect();
    console.log('PostgreSQL connected successfully! ✅');
    client.release();
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
  }
}
testPgConnection();

app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    // Get mosque results
    const { rows: mosqueResults } = await pgPool.query(
      'SELECT * FROM mosque WHERE name ILIKE $1 OR city ILIKE $2',
      [`%${query}%`, `%${query}%`]
    );

    if (mosqueResults.length > 0) {
      const mosqueIds = mosqueResults.map(mosque => mosque.mosque_id);

      // Get prayer times for found mosques
      const { rows: salahResults } = await pgPool.query(
        'SELECT mosque_id, salah_name, azan_time, salah_time FROM salah WHERE mosque_id = ANY($1)',
        [mosqueIds]
      );

      // Organize prayer times by mosque_id
      const prayerTimesByMosque = salahResults.reduce((acc, prayer) => {
        if (!acc[prayer.mosque_id]) {
          acc[prayer.mosque_id] = {};
        }
        acc[prayer.mosque_id][prayer.salah_name] = {
          azan: prayer.azan_time,
          salah: prayer.salah_time
        };
        return acc;
      }, {});

      // Combine mosque and prayer data
      const combinedResults = mosqueResults.map(mosque => ({
        ...mosque,
        prayerTimes: prayerTimesByMosque[mosque.mosque_id] || {}
      }));

      res.json(combinedResults);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Fetch all admins
app.get('/api/admins', async (req, res) => {
  try {
    const { rows: admins } = await pgPool.query('SELECT * FROM users WHERE role = $1', ['admin']);
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Get prayer times for a mosque based on admin email
app.get('/api/prayer-times', async (req, res) => {
  const { admin_email } = req.query;

  if (!admin_email) {
    return res.status(400).json({ error: 'Admin email is required' });
  }

  try {
    // Get mosque_id for the admin
    const { rows: userResult } = await pgPool.query('SELECT mosque_id FROM users WHERE email = $1', [admin_email]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mosque_id = userResult[0].mosque_id;

    // Get prayer times for the mosque
    const { rows: prayerTimes } = await pgPool.query(
      'SELECT salah_name, azan_time, salah_time FROM salah WHERE mosque_id = $1',
      [mosque_id]
    );

    res.status(200).json(prayerTimes);
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    res.status(500).json({ error: 'Failed to fetch prayer times' });
  }
});

// Add a new mosque
app.post('/api/mosques', async (req, res) => {
  const { name, admin_email, address_line_1, address_line_2, postal_code, city, state, country, longitude, latitude } = req.body;

  if (!name || !admin_email || !address_line_1 || !address_line_2 || !postal_code || !city || !state || !country) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  try {
    // Insert new mosque
    await pgPool.query(
      'INSERT INTO mosque (name, address_line_1, address_line_2, postal_code, city, state, country, longitude, latitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [name, address_line_1, address_line_2, postal_code, city, state, country, longitude, latitude]
    );

    // Get mosque_id of the newly inserted mosque
    const { rows: mosqueIdResult } = await pgPool.query(
      'SELECT mosque_id FROM mosque WHERE name = $1 AND address_line_1 = $2 AND address_line_2 = $3 AND postal_code = $4 AND city = $5 AND state = $6 AND country = $7',
      [name, address_line_1, address_line_2, postal_code, city, state, country]
    );

    const mosque_id = mosqueIdResult[0]?.mosque_id;

    if (!mosque_id) {
      return res.status(500).json({ error: 'Failed to retrieve mosque_id' });
    }

    // Check if admin email already exists
    const { rows: existingUser } = await pgPool.query('SELECT * FROM users WHERE email = $1', [admin_email]);

    if (existingUser.length === 0) {
      // Create new admin user
      await pgPool.query(
        'INSERT INTO users (email, role, mosque_id) VALUES ($1, $2, $3)',
        [admin_email, 'admin', mosque_id]
      );
    } else {
      // Update existing user's mosque_id
      await pgPool.query(
        'UPDATE users SET mosque_id = $1 WHERE email = $2',
        [mosque_id, admin_email]
      );
    }

    res.status(201).json({
      id: mosque_id,
      name,
      admin_email,
      address_line_1,
      address_line_2,
      postal_code,
      city,
      state,
      country,
      longitude,
      latitude
    });
  } catch (error) {
    console.error('Error adding mosque:', error);
    res.status(500).json({ error: 'Failed to add mosque' });
  }
});

// Update prayer times
app.post('/api/update-prayer-times', async (req, res) => {
  const { adminEmail, updatedTimes } = req.body;

  if (!adminEmail || !updatedTimes) {
    return res.status(400).json({ error: 'Admin email and times are required' });
  }

  try {
    // Get mosque_id associated with the admin
    const { rows: userResult } = await pgPool.query('SELECT mosque_id FROM users WHERE email = $1', [adminEmail]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mosque_id = userResult[0].mosque_id;

    // Update prayer times or insert if they don't exist
    const updatePromises = Object.entries(updatedTimes).map(async ([prayer, { adhan, salah }]) => {
      // Check if the prayer time exists
      const { rowCount } = await pgPool.query(
        'SELECT * FROM salah WHERE mosque_id = $1 AND salah_name = $2',
        [mosque_id, prayer.charAt(0).toUpperCase() + prayer.slice(1)]
      );

      if (rowCount > 0) {
        // Update existing prayer time
        await pgPool.query(
          'UPDATE salah SET azan_time = $1, salah_time = $2 WHERE mosque_id = $3 AND salah_name = $4',
          [adhan, salah, mosque_id, prayer.charAt(0).toUpperCase() + prayer.slice(1)]
        );
      } else {
        // Insert new prayer time if it doesn't exist
        await pgPool.query(
          'INSERT INTO salah (mosque_id, salah_name, azan_time, salah_time) VALUES ($1, $2, $3, $4)',
          [mosque_id, prayer.charAt(0).toUpperCase() + prayer.slice(1), adhan, salah]
        );
      }
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Prayer times updated successfully' });
  } catch (error) {
    console.error('Error updating prayer times:', error);
    res.status(500).json({ error: 'Failed to update prayer times' });
  }
});


/*  -------------------------------------------------------- */
// MYSQL ENDPOINTS

// // Test database connection
// async function testConnection() {
//   try {
//     const connection = await pool.getConnection();
//     console.log('Database connected successfully! ✅');
//     connection.release();
//   } catch (error) {
//     console.error('Error connecting to the database:', error);
//   }
// }
// testConnection();

// app.post('/api/search', async (req, res) => {
//   try {
//     const { query } = req.body;

//     // First get mosque results
//     const [mosqueResults] = await pool.query(
//       'SELECT * FROM mosque WHERE name LIKE ? OR city LIKE ?',
//       [`%${query}%`, `%${query}%`]
//     );

//     // If we found any mosques, get their prayer times
//     if (mosqueResults.length > 0) {
//       const mosqueIds = mosqueResults.map(mosque => mosque.mosque_id);

//       // Query salah table for these mosque_ids
//       const [salahResults] = await pool.query(
//         'SELECT mosque_id, salah_name, azan_time, salah_time FROM salah WHERE mosque_id IN (?)',
//         [mosqueIds]
//       );

//       // Organize prayer times by mosque_id
//       const prayerTimesByMosque = salahResults.reduce((acc, prayer) => {
//         if (!acc[prayer.mosque_id]) {
//           acc[prayer.mosque_id] = {};
//         }
//         acc[prayer.mosque_id][prayer.salah_name] = {
//           azan: prayer.azan_time,
//           salah: prayer.salah_time
//         };
//         return acc;
//       }, {});

//       // Combine mosque and prayer data
//       const combinedResults = mosqueResults.map(mosque => ({
//         ...mosque,
//         prayerTimes: prayerTimesByMosque[mosque.mosque_id] || {}
//       }));

//       res.json(combinedResults);
//     } else {
//       res.json([]);
//     }
//   } catch (error) {
//     console.error('Search error:', error);
//     res.status(500).json({ error: 'Search failed' });
//   }
// });

// // Endpoint to fetch all admins
// app.get('/api/admins', async (req, res) => {
//   try {
//     const [admins] = await pool.query('SELECT * FROM users WHERE role = "admin"');
//     res.json(admins);
//   } catch (error) {
//     console.error('Error fetching admins:', error);
//     res.status(500).json({ error: 'Failed to fetch admins' });
//   }
// });

// // Endpoint to get prayer times for a mosque based on admin email
// app.get('/api/prayer-times', async (req, res) => {
//   const { admin_email } = req.query; // Get admin_email from query parameters

//   if (!admin_email) {
//     return res.status(400).json({ error: 'Admin email is required' });
//   }

//   try {
//     // Retrieve the mosque_id based on the admin email
//     const [userResult] = await pool.query('SELECT mosque_id FROM users WHERE email = ?', [admin_email]);
//     // console.log(userResult)

//     if (userResult.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const mosque_id = userResult[0].mosque_id;

//     // Fetch prayer times from the salah table for the mosque_id
//     const [prayerTimes] = await pool.query('SELECT salah_name, azan_time, salah_time FROM salah WHERE mosque_id = ?', [mosque_id]);

//     // Respond with the prayer times
//     res.status(200).json(prayerTimes);
//   } catch (error) {
//     console.error('Error fetching prayer times:', error);
//     res.status(500).json({ error: 'Failed to fetch prayer times' });
//   }
// });

// // Endpoint to add a new mosque
// app.post('/api/mosques', async (req, res) => {
//   const { name, admin_email, address_line_1, address_line_2, postal_code, city, state, country, longitude, latitude } = req.body;

//   // Validate required fields
//   if (!name || !admin_email || !address_line_1 || !address_line_2 || !postal_code || !city || !state || !country) {
//     return res.status(400).json({ error: 'All required fields must be provided' });
//   }

//   try {
//     // Insert new mosque into the database
//     await pool.query(
//       'INSERT INTO mosque (name, address_line_1, address_line_2, postal_code, city, state, country, longitude, latitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
//       [name, address_line_1, address_line_2, postal_code, city, state, country, longitude, latitude]
//     );

//     // Retrieve the mosque_id based on the unique combination of fields
//     const [mosqueIdResult] = await pool.query(
//       'SELECT mosque_id FROM mosque WHERE name = ? AND address_line_1 = ? AND address_line_2 = ? AND postal_code = ? AND city = ? AND state = ? AND country = ?',
//       [name, address_line_1, address_line_2, postal_code, city, state, country] // Ensure these fields are unique to get the correct mosque_id
//     );

//     const mosque_id = mosqueIdResult[0]?.mosque_id; // Get the mosque_id from the result

//     if (!mosque_id) {
//       return res.status(500).json({ error: 'Failed to retrieve mosque_id' });
//     }

//     // Check if the admin email already exists in the users table
//     const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [admin_email]);

//     if (existingUser.length === 0) {
//       // Create new user if it doesn't exist or update if it exists
//       await pool.query(
//         'INSERT INTO users (email, role, mosque_id) VALUES (?, ?, ?)',
//         [admin_email, 'admin', mosque_id] // Link the user to the mosque
//       );
//     } else {
//       // If the user exists, update the mosque_id
//       await pool.query(
//         'UPDATE users SET mosque_id = ? WHERE email = ?',
//         [mosque_id, admin_email]
//       );
//     }

//     // Respond with the newly created mosque data
//     const newMosque = {
//       id: mosque_id,
//       name,
//       admin_email,
//       address_line_1,
//       address_line_2,
//       postal_code,
//       city,
//       state,
//       country,
//       longitude,
//       latitude
//     };

//     res.status(201).json(newMosque);
//   } catch (error) {
//     console.error('Error adding mosque:', error);
//     res.status(500).json({ error: 'Failed to add mosque' });
//   }
// });

// app.post('/api/update-prayer-times', async (req, res) => {
//   const { adminEmail, updatedTimes } = req.body;

//   if (!adminEmail || !updatedTimes) {
//     return res.status(400).json({ error: 'Admin email and times are required' });
//   }

//   try {
//     // Get mosque_id associated with the admin email
//     const [userResult] = await pool.query('SELECT mosque_id FROM users WHERE email = ?', [adminEmail]);

//     if (userResult.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const mosque_id = userResult[0].mosque_id;

//     // Update the salah table with the new prayer times
//     const updatePromises = Object.entries(updatedTimes).map(([prayer, { adhan, salah }]) =>
//       pool.query(
//         'UPDATE salah SET azan_time = ?, salah_time = ? WHERE mosque_id = ? AND salah_name = ?',
//         [adhan, salah, mosque_id, prayer.charAt(0).toUpperCase() + prayer.slice(1)]
//       )
//     );

//     await Promise.all(updatePromises);

//     res.status(200).json({ message: 'Prayer times updated successfully' });
//   } catch (error) {
//     console.error('Error updating prayer times:', error);
//     res.status(500).json({ error: 'Failed to update prayer times' });
//   }
// });

/*  -------------------------------------------------------- */

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
}); 