import { seedDummyUsers } from "../src/lib/dummy-users";

const result = await seedDummyUsers(120);
console.log(
  JSON.stringify(
    {
      created: result.created,
      skipped: result.skipped,
      total: result.total,
      sample: result.credentials[0],
    },
    null,
    2,
  ),
);
