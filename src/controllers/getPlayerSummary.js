const getPlayerSummary = async (req, res) => {
  const steamApiKey = process.env.steamApiKey;
  const steamid = process.env.steamid;

  console.log('my steam id is: ', steamid);
  console.log('my api key is: ', steamApiKey);
  try {
    const response = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamid}`);
    console.log("fetching data")
    const data = await response.json();
    console.log("fetched data as: ", JSON.stringify(data))

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch achievements for appid: ${appid}` })
    };
  }
};

module.exports = {
  getPlayerSummary
};