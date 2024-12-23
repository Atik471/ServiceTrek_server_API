const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("ServieTrek");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8nuar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("ServiceTrek").collection("services");
    const reviewCollection = client.db("ServiceTrek").collection("reviews");

    app.post("/services/add", async (req, res) => {
      try {
        const newService = req.body;
        const result = await serviceCollection.insertOne(newService);

        res.status(200).json({
          message: "Service added successfully",
          serviceId: result.insertedId,
        });
      } catch (error) {
        console.error("Error adding service:", error);
        res.status(500).json({ error: "Failed to add service" });
      }
    });

    app.get("/services", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const items = await serviceCollection.find().skip(skip).limit(limit).toArray();

        const total = await serviceCollection.countDocuments();

        res.json({
          items,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get(`/services/:id`, async (req, res) => {
      try {
        const { id } = req.params;
        const service = await serviceCollection.findOne({ _id: new ObjectId(id) });
    
        if (!service) {
          return res.status(404).json({ error: "Service not found" });
        }
    
        res.status(200).json(service);
      } catch (error) {
        console.error("Error fetching service details:", error);
        res.status(500).json({ error: "Failed to fetch service details" });
      };
    });

    app.post('/reviews/add', async (req, res) => {
      try {
        const newReview = req.body;
        const result = await reviewCollection.insertOne(newReview);

        res.status(200).json({
          message: "Review added successfully",
          reviewId: result.insertedId,
        })
      }
      catch (err) {
        res.status(500).json({
          error: "Failed posting review!",
        })
      }
    })

  } finally {
  }
}
run().catch(console.dir);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
