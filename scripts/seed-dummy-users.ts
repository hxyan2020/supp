/**
 * Seed 120 dummy users into data/store/db.json
 * Usage: npx tsx scripts/seed-dummy-users.ts
 */
import { seedDummyUsers } from "../src/lib/dummy-users";

async function main() {
  const result = await seedDummyUsers(120);
  console.log(
    `Dummy users ready: created=${result.created} refreshed=${result.skipped} total=${result.total}`,
  );
  console.log("Credentials written to data/store/dummy-credentials.json");
  console.log("Example: username=demo001 password=Demo001!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
