// const gameDetails = async (appIds: number[]) => {
//         return await Promise.all(
//           appIds.map(async (appid) => {
//             // await this.rateLimitDelay(300, 1000);
//             const res = await delayedFetch(
//               `https://store.steampowered.com/api/appdetails/?appids=${appid}`
//             );
//             console.log(res);
//             const data = await res.json();
//             return data.data;
//             // .then((res) => res.data)
//             // .catch((error) => {
//             //   console.error(
//             //     `Error fetching details for appid ${appid}:`,
//             //     error.response?.data || error.message
//             //   );
//             //   return null;
//             // });
//           })
//         );
//       };
