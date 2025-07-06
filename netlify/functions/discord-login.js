const functions = require('@netlify/functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// === ✅ Initialize Firebase Admin ===
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// === ✅ Main function ===
exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing code parameter" }),
    };
  }

  try {
    // === ✅ Exchange code for Discord access token ===
    const params = new URLSearchParams();
    params.append('client_id', process.env.1391410094117359720);
    params.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.);

    params.append('scope', 'identify');

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error(tokenData);
      throw new Error(tokenData.error_description);
    }

    const accessToken = tokenData.access_token;

    // === ✅ Fetch Discord user ===
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const discordUser = await userRes.json();
    if (discordUser.id) {
      // === ✅ Create Firebase custom token ===
      const uid = discordUser.id;
      const additionalClaims = {
        discordUsername: `${discordUser.username}#${discordUser.discriminator}`,
      };

      const customToken = await admin.auth().createCustomToken(uid, additionalClaims);

      return {
        statusCode: 200,
        body: JSON.stringify({ customToken }),
      };
    } else {
      throw new Error("Failed to fetch Discord user");
    }

  } catch (err) {
    console.error("❌ Discord login error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
