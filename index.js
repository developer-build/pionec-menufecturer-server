/* -------------require file here---------------- */
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;
require("dotenv").config();
//?-------------------Stripe Code ---------------//

const stripe = require("stripe")(
  "sk_test_51L0iOtAL8nuA0IetwWqmz2Te1188zpj9RJFWB7zwzzvldw2Vv9Yw66d36pAGebRz6MKHHMLQ6yHJ3kZKLNzCNWtq00NnILQF5c"
);

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

    // ?-------------Data Collection ---------------- *//

    const toolsCollection = client.db("pionec-menufecture").collection("tools");
    const paymentCollection = client
      .db("pionec-menufecture")
      .collection("payments");
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
    //single order find
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });
    // delete data form my order page
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      // const option = { upsert: true };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await paymentCollection.insertOne(payment);
      const updatedBooking = await orderCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedBooking);
    });

    //?---------------Payment api here----------------//
    app.post("/create-payment-intent", async (req, res) => {
      const service = req.body;
      const price = service.price;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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
