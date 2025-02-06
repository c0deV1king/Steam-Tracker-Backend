import fetch from 'node-fetch';


export const getPlayerSummary = async (req, res) => {
  const response = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=76561198119786249`);
  const data = await response.json();
  console.log(data);
};