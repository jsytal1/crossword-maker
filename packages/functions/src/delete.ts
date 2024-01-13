import { Table } from "sst/node/table";
import handler from "@crossword-maker/core/handler";
import dynamoDb from "@crossword-maker/core/dynamodb";

export const main = handler(async (event) => {
  const params = {
    TableName: Table.GridConfigs.tableName,
    Key: {
      userId: "123", // The id of the author
      gridConfigId: event?.pathParameters?.id,
    },
  };

  await dynamoDb.delete(params);

  return JSON.stringify({ status: true });
});
