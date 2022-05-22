/* -------------require file here---------------- */
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
/* -------------Middle were Here---------------- */
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
/* -------------Mongodb code Here---------------- */

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7s7y6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("pionec-menufecture").collection("tools");
    /* -------------Tools API  Here---------------- */
    app.get("/tool", async (req, res) => {
      const tools = await toolsCollection.find().toArray();
      res.send(tools);
    });
    app.get("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query)
      res.send(result)
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

/* -------------Default Api Here---------------- */
app.get("/", (req, res) => {
  res.send("Pionec server is running");
});

app.listen(port, () => {
  console.log(`Pionec server running on Port ${port}`);
});
