const express = require('express')
const app = express()
const port = process.env.PORT || 5001
const cors = require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t79plj2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const userClasses = client.db('summerCamp').collection('classes');
    const cartCollection = client.db('summerCamp').collection('carts');
    const usersCollection = client.db('summerCamp').collection('users');

    //jwt 
    app.post('/jwt', (req,res) => {
       const user = req.body;
       console.log(user);
       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
       res.send({ token });
    })

    // classes collection
    app.get('/classes', async (req, res) => {
      const cursor = userClasses.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post('/classes', async (req, res) => {
      const item = req.body;
      const result = await userClasses.insertOne(item);
      res.send(result);
    });

    app.get('/classes/email/:instructoremail', async (req, res) => {
      const instructorEmail = req.params.instructoremail;
      const user = await userClasses.find({ Email: instructorEmail }).toArray();
      res.send(user);
    });

    app.get('/classes/:id', async (req, res) => {
      const Id = req.params.id;
      const user = await userClasses.findOne({ _id: new ObjectId(Id)});
      res.send(user);
    });

    app.get('/classes/:id/Feedback', async (req, res) => {
      // const Id = req.params.id;
      // const user = await userClasses.find({ _id: new ObjectId(Id)}).toArray();
      // res.send(user);

      const Id = req.params.id;
      const user = await userClasses.find({ _id: new ObjectId(Id) }).project({ Feedback: 1 }).toArray();

      // If you want to send only the Feedback field, you can map the result
      const feedback = user.map(u => u.Feedback);

      res.send(feedback);
    });

    app.put('/classes/:id', async(req,res) => {
      const id = req.params.id;
      const classes = req.body; 
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updatedUser = {
        $set: {
            ClassName: classes.classname,
            Img: classes.img,     
            Seats: classes.price,
            Price: classes.seat,
        }
      }
      const result = await userClasses.updateOne(filter, updatedUser, options);
      res.send(result);
   })

    app.put('/classes/feedback/:id', async(req,res) => {
      const id = req.params.id;
      const classes = req.body; 
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updatedUser = {
        $set: {
            Feedback: classes.feedback,
        }
      }
      const result = await userClasses.updateOne(filter, updatedUser, options);
      res.send(result);
   })

    app.put('/classes/status/:id', async(req,res) => {
      const id = req.params.id;
      const classes = req.body;
      console.log(classes); 
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updatedUser = {
        $set: {
            Status: classes.value,
        }
      }
      const result = await userClasses.updateOne(filter, updatedUser, options);
      res.send(result);
   })



    // carts collection
    app.post('/carts', async (req, res) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    app.get('/carts', async (req, res) => {
      const cursor = cartCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/carts/:email', async (req,res) => {
        const userEmail = req.params.email;
        const user = await cartCollection.find({ UserEmail: userEmail}).toArray();
        res.send(user);
    })



    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

    //users collection
    app.get('/users', async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/users/instructor', async (req, res) => {
      try {
        const cursor = usersCollection.find({ role: 'Instructor' });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'An error occurred while fetching users.', error });
      }
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) return res.send({ message: 'user already exists' })

      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    app.put('/users/:id', async(req,res) => {
      const id = req.params.id;
      const classes = req.body;
      const filter = {_id: new ObjectId(id)}; 
      const options = {upsert: true};
      const updatedUser = {
        $set: {
            role: classes.value,
        }
      }
      const result = await usersCollection.updateOne(filter, updatedUser, options);
      res.send(result);
   })


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);