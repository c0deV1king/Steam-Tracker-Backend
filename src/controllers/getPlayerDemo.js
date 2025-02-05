import fetch from 'node-fetch';

export async function handler(event, context) {
  const steamApiKey = process.env.STEAM_API_KEY;
  const steamid = event.queryStringParameters.steamid;

  try {
    const response = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=76561198119786249`);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch steam profile: ${steamid}` })
    };
  }
};

const getTestMessage = (req, res) => {
    res.send("Yo, this is the controller speaking from ./src/controllers/getPlayerDemo.js !")
};

module.exports = {
    getTestMessage
};