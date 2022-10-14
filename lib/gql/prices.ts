import { gql, GraphQLClient } from "graphql-request";

const pricesQuery = gql`
  query PriceHistory($outcomeAsset: String, $startTime: DateTime) {
    historicalAssets(
      where: { assetId_contains: $outcomeAsset, timestamp_gte: $startTime }
      orderBy: blockNumber_ASC
    ) {
      newPrice
      timestamp
    }
  }
`;

export interface AssetPrice {
  newPrice: number;
  timestamp: string;
}

export const getAssetPriceHistory = async (
  client: GraphQLClient,
  outcomeAsset: string,
  startTime: string, //ISO string format
) => {
  //   const combinedId = `[${marketId},${
  //     typeof assetId === "string" ? `"${assetId}"` : assetId
  //   }]`;
  console.log(outcomeAsset);

  const response = await client.request<{
    historicalAssets: AssetPrice[];
  }>(pricesQuery, {
    outcomeAsset,
    startTime,
  });

  console.log(response);

  return response.historicalAssets;
};
