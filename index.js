require('dotenv').config()
const express = require("express")
const port = process.env.PORT || 5000
const app = express()
const jwt = require("jsonwebtoken")
const cors = require("cors")
app.use(cors({
    origin: ["http://localhost:5173", "https://weatherapp-e8608.web.app"],
    credentials: true
}))

app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.xbiw867.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const userCollection = client.db("alpaago").collection("users")

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");



        // login token
        app.post("/api/token", async (req, res) => {
            const email = req.body
            const yearInSecond = 365 * 24 * 60 * 60 //365 day in second
            const expireDate = new Date(Date.now() + yearInSecond * 1000)

            const token = jwt.sign(email, process.env.ACCESS_TOKEN, { expiresIn: "365d" })

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                expires: expireDate
            }).send({ success: true });



        })



        // add user 
        app.post("/api/add_user", async (req, res) => {
            const { body } = req
            const result = await userCollection.insertOne(body)
            res.send(result)
        })

        //all user data
        app.get('/api/users', async (req, res) => {
            const { status, date } = req.query
            let find = {}

            if (status) {
                const replica = {
                    ...find,
                    status: status
                }
                find = replica
            }

            if (date) {
                const replica = {
                    ...find,
                    date: date
                }

                find = replica
            }

            const result = await userCollection.find(find).toArray()
            res.send(result)
        })


        // change user status 
        app.put("/api/user/status", async (req, res) => {
            const { status, id } = req.query
            const find = {
                _id: new ObjectId(id)
            }

            const update = {
                $set: {
                    status: status
                }
            }
            const result = await userCollection.updateOne(find, update)
            res.send(result)
        })

        // delete user
        app.delete("/api/user", async (req, res) => {
            const { id } = req.query
            const find = {
                _id: new ObjectId(id)
            }

            const result = userCollection.deleteOne(find)
            res.send(result)
        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.listen(port)
