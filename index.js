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

        const items = await serviceCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();

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

    app.get("/top-services", async (req, res) => {
      try {
        const items = await serviceCollection.find().limit(6).toArray();

        res.status(200).json(items);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get(`/services/:id`, async (req, res) => {
      try {
        const { id } = req.params;
        const service = await serviceCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!service) {
          return res.status(404).json({ error: "Service not found" });
        }

        res.status(200).json(service);
      } catch (error) {
        console.error("Error fetching service details:", error);
        res.status(500).json({ error: "Failed to fetch service details" });
      }
    });

    app.get("/my-services/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await serviceCollection.find({ uid: id }).toArray();
        res.status(200).json(result);
      } catch (err) {
        res.status(500).json({
          error: "Failed fetching your services!",
        });
      }
    });

    app.patch("/update-service/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid service ID" });
        }

        const updatedData = req.body;

        if (!updatedData || Object.keys(updatedData).length === 0) {
          return res.status(400).json({ error: "No update data provided" });
        }

        const result = await serviceCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({ error: "Service not found or no changes made" });
        }

        res.status(200).json({
          message: "Service updated successfully",
          updatedService: result,
        });
      } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({ error: "Failed to update service" });
      }
    });

    app.delete("/delete-service/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid service ID" });
        }

        const result = await serviceCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Service not found" });
        }

        res.status(200).json({ message: "Service deleted successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete service" });
      }
    });

    app.post("/reviews/add", async (req, res) => {
      try {
        const newReview = req.body;
        const result = await reviewCollection.insertOne(newReview);

        res.status(200).json({
          message: "Review added successfully",
          reviewId: result.insertedId,
        });
      } catch (err) {
        res.status(500).json({
          error: "Failed posting review!",
        });
      }
    });

    app.get("/reviews/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid serviceId" });
        }

        const result = await reviewCollection.find({ serviceId: id }).toArray();
        res.status(200).json(result);
      } catch (err) {
        res.status(500).json({
          error: "Failed fetching reviews!",
        });
      }
    });

    app.get("/my-reviews/:id", async (req, res) => {
      try {
        const { id } = req.params;
    
        if (!id) {
          return res.status(400).json({ error: "User ID is required" });
        }
    
        const result = await reviewCollection.find({ uid: id }).toArray();
    
        if (!result || result.length === 0) {
          return res.status(200).json([]);
        }
    
        res.status(200).json(result);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({
          error: "Failed fetching your reviews!",
        });
      }
    });

    app.patch("/update-review/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid review ID" });
        }

        const updatedData = req.body;

        if (!updatedData || Object.keys(updatedData).length === 0) {
          return res.status(400).json({ error: "No update data provided" });
        }

        const result = await reviewCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({ error: "Review not found or no changes made" });
        }

        res.status(200).json({
          message: "Review updated successfully",
          updatedService: result,
        });
      } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ error: "Failed to update review" });
      }
    });

    app.delete("/delete-review/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid review ID" });
        }

        const result = await reviewCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Review not found" });
        }

        res.status(200).json({ message: "Review deleted successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete review" });
      }
    });

  } finally {
  }
}
run().catch(console.dir);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
