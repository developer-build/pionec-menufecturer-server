/* -------------require file here---------------- */
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;
require("dotenv").config();
//?-------------------Stripe Code ---------------//

const stripe = require("stripe")(process.env.STRIPE_SECRECT_KEY);

/* -------------Middle were Here---------------- */
app.use(cors());
app.use(express.json());
//?-----------------JWT Middleware----------------//
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.SECRECT_ACCESS_KEY, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

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

    // ?-------------Data Collection ---------------- *//

    const userCollection = client.db("pionec-menufecture").collection("users");
    const toolsCollection = client.db("pionec-menufecture").collection("tools");
    const reviewCollection = client
      .db("pionec-menufecture")
      .collection("reviews");
    const paymentCollection = client
      .db("pionec-menufecture")
      .collection("payments");
    const orderCollection = client
      .db("pionec-menufecture")
      .collection("orders");
    //? ------------------Admin Middleware----------------//
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        return res.status(403).send({ message: "Forbidded" });
      }
    };
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
    app.post("/tool", verifyJWT, verifyAdmin, async (req, res) => {
      const tool = req.body;
      const result = await toolsCollection.insertOne(tool);
      res.send(result);
    });
    app.delete("/delete-tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    });

    //? -------------Orders API  Here---------------- */
    app.get("/order", verifyJWT, verifyAdmin, async (req, res) => {
      const orders = await orderCollection.find().toArray();
      res.send(orders);
    });
    app.post("/order", async (req, res) => {
      const data = req.body;
      const result = await orderCollection.insertOne(data);
      res.send(result);
    });

    // my orders data send form here
    app.get("/my-order", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const orders = orderCollection.find(query);
        const result = await orders.toArray();
        return res.send(result);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
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
    // patch order for checking payment status
    app.patch("/order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
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
    // this api for shipping status change / pending to shipped
    app.patch("/shipping-order/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          ship: true,
        },
      };
      const updatedBooking = await orderCollection.updateOne(
        filter,
        updatedDoc,
        option
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
    //?------------------Review Api Here------------------//
    app.post("/review", async (req, res) => {
      const data = req.body;
      const review = await reviewCollection.insertOne(data);
      res.send(review);
    });
    app.get("/review", async (req, res) => {
      const data = await reviewCollection.find().toArray();
      res.send(data);
    });
    //?-----------------Users Api here -------------------//
    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get("/current-user", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //?----------------Admin----------------//
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      // const option = { upsert: true };
      const updatedData = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(
        filter,
        updatedData
        // option
      );
      res.send(result);
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;

      const filter = { email: email };
      const option = { upsert: true };
      const updatedData = {
        $set: user,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedData,
        option
      );
      const token = jwt.sign({ email: email }, process.env.SECRECT_ACCESS_KEY, {
        expiresIn: "1d",
      });
      res.send({ result, token });
    });
    app.put("/current-user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const option = { upsert: true };
      const updatedData = {
        $set: user,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedData,
        option
      );
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
