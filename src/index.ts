import { Elysia } from "elysia";
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";

const app = new Elysia()
  .get("/", () => {
    console.log("basic get request here");
    return "Hello Elysia";
  })
  .onParse(async ({ request, headers }) => {
    if (headers["content-type"] === "application/json") {
      const arrayBuffer = await Bun.readableStreamToArrayBuffer(request.body!);
      const rawBody = Buffer.from(arrayBuffer).toString("utf-8");
      try {
        const parsedBody = JSON.parse(rawBody);
        return { ...parsedBody, rawBody };
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return {};
      }
    }
  })
  .post("/", async ({ body, request, headers }) => {
    if (!body) {
      console.log("No body received in POST request");
      return "No body sent";
    }

    console.log("Body received:", body);
    console.log("Interaction type:", body.type, "Type of:", typeof body.type);

    if (request.method === "POST") {
      const signature = headers["x-signature-ed25519"];
      const timestamp = headers["x-signature-timestamp"];

      const isValidRequest =
        signature &&
        timestamp &&
        process.env.PUBLIC_KEY &&
        verifyKey(body.rawBody, signature, timestamp, process.env.PUBLIC_KEY);

      console.log("Signature valid?", isValidRequest);
      if (!isValidRequest) {
        return new Response("Invalid signature", { status: 401 });
      }
    }

    if (body.type === InteractionType.PING) {
      console.log("Received PING interaction");
      return new Response(
        JSON.stringify({ type: InteractionResponseType.PONG }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else {
      console.log("Unknown interaction type");
      return new Response(JSON.stringify({ error: "Unknown Type" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
