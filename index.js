/* -------------require file here---------------- */
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;
require("dotenv").config();
/* -------------Middle were Here---------------- */
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
/* -------------Mongodb code Here---------------- */

const uri = `mongodb+srv://admin:2TGlaIWb3Kri4yt4@cluster0.7s7y6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    // todo-------------Data Collection Heear API  Here---------------- */

    const toolsCollection = client.db("pionec-menufecture").collection("tools");
    const orderCollection = client
      .db("pionec-menufecture")
      .collection("orders");

    //? -------------Tools API  Here---------------- */
    app.get("/tool", async (req, res) => {
      const tools = await toolsCollection.find().toArray();
      res.send(tools);
    });
    app.get("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      res.send(result);
    });

    //? -------------Orders API  Here---------------- */

    app.post("/order", async (req, res) => {
      const data = req.body;
      const result = await orderCollection.insertOne(data);
      res.send(data);
    });

    // my orders data send form here
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const orders = orderCollection.find(query);
      const result = await orders.toArray();
      res.send(result);
    });
    // delete data form my order page
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

/*//* -------------Default Api Here---------------- */
app.get("/", (req, res) => {
  res.send("Pionec server is running");
});

app.listen(port, () => {
  console.log(`Pionec server running on Port ${port}`);
});
