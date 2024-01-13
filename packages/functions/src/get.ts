import { Table } from "sst/node/table";
import handler from "@crossword-maker/core/handler";
import dynamoDb from "@crossword-maker/core/dynamodb";

export const main = handler(async (event) => {
  const params = {
    TableName: Table.GridConfigs.tableName,
    // 'Key' defines the partition key and sort key of
    // the item to be retrieved
    Key: {
      userId: event.requestContext.authorizer?.iam.cognitoIdentity.identityId,
      gridConfigId: event?.pathParameters?.id,
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Item not found.");
  }

  // Return the retrieved item
  return JSON.stringify(result.Item);
});
