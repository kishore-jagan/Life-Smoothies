const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB, pool } = require('./db');
const userRouter = require('./router')

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

connectDB();

app.use('/api', userRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



