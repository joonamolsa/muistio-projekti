const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DB;
const containerId = "users";

const client = new CosmosClient({ endpoint, key });

async function findUser(username) {
  const database = client.database(databaseId);
  const container = database.container(containerId);

  const querySpec = {
    query: "SELECT * FROM c WHERE c.username = @username",
    parameters: [{ name: "@username", value: username }],
  };

  const { resources } = await container.items.query(querySpec).fetchAll();
  return resources[0]; // Palauttaa ensimmäisen osuman tai undefined
}

module.exports = { findUser };
