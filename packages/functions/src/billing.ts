import Stripe from "stripe";
import { Config } from "sst/node/config";
import handler from "@crossword-maker/core/handler";
import { calculateCost } from "@crossword-maker/core/cost";

export const main = handler(async (event) => {
  const { storage, source } = JSON.parse(event.body || "{}");
  const amount = calculateCost(storage);
  const description = "Make Me Cross charge";

  // Load our secret key
  const stripe = new Stripe(Config.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  await stripe.charges.create({
    source,
    amount,
    description,
    currency: "usd",
  });

  return JSON.stringify({ status: true });
});
