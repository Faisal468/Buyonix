require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const authRoute = require("./routes/auth");
const sellerRoute = require("./routes/seller");
const passportSetup = require("./passport");
const CFRecommender = require("./utils/cfRecommender");

//connect to mongodb
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log(err);
});

// Use express-session instead of cookie-session
app.use(
    session({
        name: "session",
        secret: "cyberwolve",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true,
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: "GET,POST,PUT,DELETE",
        credentials: true,
    })
);

app.use("/auth", authRoute);
app.use("/seller", sellerRoute);
app.use("/product", require("./routes/product"));
app.use("/order", require("./routes/order"));
app.use("/payment", require("./routes/payment"));
app.use("/bargain", require("./routes/bargain"));

const port = process.env.PORT || 5000;

// Initialize AI models on server startup
const cfRecommender = new CFRecommender();
cfRecommender.initialize().then((success) => {
    if (success) {
        console.log("✓ AI Recommendation engine initialized");
    } else {
        console.log("⚠️  AI Recommendation engine initialization failed (non-critical)");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
    console.log("🤖 AI-powered recommendations available at /product/recommendations/:userId");
});

module.exports = app;