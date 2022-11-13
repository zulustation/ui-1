import Decimal from "decimal.js";
import { gql, GraphQLClient } from "graphql-request";

import { TrendingMarketInfo } from "components/markets/TrendingMarketCard";
import { ZTG } from "lib/constants";

// TODO: change this to env variable or some other configuration method.
const marketIds = [1, 1, 1];

const marketQuery = gql`
  query Market($marketId: Int) {
    markets(where: { marketId_eq: $marketId }) {
      marketId
      poolId
      outcomeAssets
      slug
      img
      marketType {
        categorical
        scalar
      }
      categories {
        ticker
      }
    }
  }
`;

const poolQuery = gql`
  query Pool($poolId: Int) {
    pools(where: { poolId_eq: $poolId }) {
      id
      volume
      baseAsset
    }
  }
`;

const assetsQuery = gql`
  query Assets($poolId: Int) {
    assets(where: { poolId_eq: $poolId }) {
      poolId
      price
      assetId
    }
  }
`;

const getFeaturedMarkets = async (client: GraphQLClient) => {

  const featuredMarkets = await Promise.all(
    marketIds.map(async (id) => {
      const marketRes = await client.request(marketQuery, {
        marketId: id,
      })

      const market = marketRes.markets[0];

      console.log(market);

      const poolRes = await client.request(poolQuery, {
        poolId: market.poolId,
      });

      console.log('poolRes', poolRes);
      const pool = poolRes.pools[0];

      const assetsRes = await client.request<{
        assets: {
          poolId: number;
          price: number;
        }[];
      }>(assetsQuery, {
        poolId: pool.poolId,
      });

      const assets = assetsRes.assets;

      let prediction: string;
      if (market.marketType.categorical) {
        let [highestPrice, highestPriceIndex] = [0, 0];
        assets.forEach((asset, index) => {
          if (asset.price > highestPrice) {
            highestPrice = asset.price;
            highestPriceIndex = index;
          }
        });

        console.log('highestPriceIndex', highestPriceIndex);
        highestPriceIndex = 0;
        prediction = market.categories[highestPriceIndex].ticker;
      } else {
        const bounds: number[] = market.marketType.scalar
          .split(",")
          .map((b) => Number(b));

        const range = Number(bounds[1]) - Number(bounds[0]);
        const significantDigits = bounds[1].toString().length;
        const longPrice = assets[0].price;
        const shortPrice = assets[1].price;

        const shortPricePrediction = range * (1 - shortPrice) + bounds[0];
        const longPricePrediction = range * longPrice + bounds[0];
        const averagePricePrediction =
          (longPricePrediction + shortPricePrediction) / 2;
        prediction = new Decimal(averagePricePrediction)
          .toSignificantDigits(significantDigits)
          .toString();
      }

      const trendingMarket: TrendingMarketInfo = {
        marketId: market.marketId,
        name: market.slug,
        img: market.img,
        outcomes: market.marketType.categorical
          ? market.marketType.categorical.toString()
          : "Long/Short",
        prediction: prediction,
        volume: new Decimal(pool.volume).div(ZTG).toFixed(0),
        baseAsset: pool.baseAsset,
      };
      return trendingMarket;
    }),
  );

  console.log('featuredMarkets', featuredMarkets);
  return featuredMarkets;
}

export default getFeaturedMarkets;
