import * as uuid from "uuid";
import { Table } from "sst/node/table";
import handler from "@crossword-maker/core/handler";
import dynamoDb from "@crossword-maker/core/dynamodb";

export const main = handler(async (event) => {
  let data = {
    layout: "",
    attachment: "",
    width: 0,
    height: 0,
  };

  if (event.body != null) {
    data = JSON.parse(event.body);
  }

  const params = {
    TableName: Table.GridConfigs.tableName,
    Item: {
      userId: "123",
      gridConfigId: uuid.v1(),
      width: data.width,
      layout: data.layout,
      attachment: data.attachment,
      createdAt: Date.now(),
    },
  };

  await dynamoDb.put(params);

  return JSON.stringify(params.Item);
});
