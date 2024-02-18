const { ApolloServer } = require("apollo-server-express");
const express = require("express");
const expressPlayground =
  require("graphql-playground-middleware-express").default;
const { readFileSync } = require("fs");
const resolvers = require("./resolvers");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const typeDefs = readFileSync("./typeDefs.graphql", "utf-8");

// 1. Create async function
async function start() {
  // 2. Call express() to create an Express application
  const app = express();

  const MONGO_DB = process.env.DB_HOST;

  const client = await MongoClient.connect(MONGO_DB, { useNewUrlParser: true });

  const db = client.db();

  // save db connection details to context
  const context = { db };

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const githubToken = req.headers.authorization;
      const currentUser = await db.collection("users").findOne({ githubToken });
      return { db, currentUser };
    },
  });

  await server.start();

  // 3. Call applyMiddleware() to allow middleware mounted on the same path
  server.applyMiddleware({ app });

  // 4. Create a home route
  app.get("/", (req, res) => res.end("Welcome to the PhotoShare API"));

  app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

  // 5. listen on a specific port
  app.listen({ port: 4000 }, () => {
    console.log(
      `GraphQL server running on @ http://localhost:4000${server.graphqlPath}`
    );
  });
}

start();
