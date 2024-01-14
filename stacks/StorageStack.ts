import { Bucket, StackContext, Table } from "sst/constructs";

export function StorageStack({ stack }: StackContext) {
  // Create an S3 bucket
  const bucket = new Bucket(stack, "Uploads", {
    cors: [
      {
        maxAge: "1 day",
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      },
    ],
  });
  // Create the DynamoDB table
  const table = new Table(stack, "GridConfigs", {
    fields: {
      userId: "string",
      gridConfigId: "string",
      width: "number",
      height: "number",
      layout: "string",
    },
    primaryIndex: { partitionKey: "userId", sortKey: "gridConfigId" },
  });

  return {
    bucket,
    table,
  };
}
