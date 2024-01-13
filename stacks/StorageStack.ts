import { Bucket, StackContext, Table } from "sst/constructs";

export function StorageStack({ stack }: StackContext) {
  // Create an S3 bucket
  const bucket = new Bucket(stack, "Uploads");
  // Create the DynamoDB table
  const table = new Table(stack, "GridConfig", {
    fields: {
      userId: "string",
      gridConfigId: "string",
      layout: "string",
    },
    primaryIndex: { partitionKey: "userId", sortKey: "gridConfigId" },
  });

  return {
    bucket,
    table,
  };
}
