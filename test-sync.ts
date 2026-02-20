import { SyncOrchestrator } from "./lib/sync";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // or .env based on the project

async function run() {
  console.log("Starting sync test...");
  const result = await SyncOrchestrator.sincronizarCompleto(
    "141f9441-b7b3-4bf8-b2b8-79d332840410",
    false
  );
  console.log("Result:", result);
}

run().catch(console.error);
