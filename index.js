const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("ServieTrek");
});

app.post('/jwt', (req, res) => {
  const user = req.body
  const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '12h'})
  res
  .cookie('token', token, {
    httpOnly: true,
    secure: false,
  })
  .send({jwtSuccess: true});
})

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if(!token){
    return res.status(401).send({message: 'Unauthorized access'})
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if(err){
      if(!token){
        return res.status(401).send({message: 'Unauthorized access'})
      }
    }
  })

  next();
}

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

    app.post("/services/add", verifyToken, async (req, res) => {
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

    app.get("/services/search", async (req, res) => {
      try {
        const { category, company, title, page = 1, limit = 10 } = req.query;
    
        const query = [];
        if (category) query.push({ category: { $regex: category, $options: "i" } });
        if (company) query.push({ company: { $regex: company, $options: "i" } });
        if (title) query.push({ title: { $regex: title, $options: "i" } });
    
        const filter = query.length > 0 ? { $or: query } : {};
    
        const pageNumber = parseInt(page);
        const pageLimit = parseInt(limit);
        const skip = (pageNumber - 1) * pageLimit;
    
        const items = await serviceCollection
          .find(filter)
          .skip(skip)
          .limit(pageLimit)
          .toArray();
    
        const total = await serviceCollection.countDocuments(filter);
    
        res.status(200).json({
          items,
          total,
          page: pageNumber,
          totalPages: Math.ceil(total / pageLimit),
        });
      } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ error: "Failed to fetch services" });
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

    app.get("/my-services/search/:id", async (req, res) => {
      try {
        const { category, company, title } = req.query;
        const { id } = req.params;
    
        const query = [];
        if (category) query.push({ category: { $regex: category, $options: "i" } });
        if (company) query.push({ company: { $regex: company, $options: "i" } });
        if (title) query.push({ title: { $regex: title, $options: "i" } });
    
        const filter = query.length > 0 ? { uid: id, $or: query } : { uid: id };
    
        const items = await serviceCollection
          .find(filter)
          .toArray();
    
        const total = await serviceCollection.countDocuments(filter);
    
        res.status(200).json(items);
      } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ error: "Failed to fetch services" });
      }
    });
    

    app.get("/my-services/:id", verifyToken, async (req, res) => {
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

    app.post("/reviews/add", verifyToken, async (req, res) => {
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
        const total = result.length;
        res.status(200).json({ result: result, total: total });
      } catch (err) {
        res.status(500).json({
          error: "Failed fetching reviews!",
        });
      }
    });

    app.get("/my-reviews/:id", verifyToken, async (req, res) => {
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

    app.patch("/update-review/:id", verifyToken, async (req, res) => {
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

    app.delete("/delete-review/:id", verifyToken, async (req, res) => {
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
