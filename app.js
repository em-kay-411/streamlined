const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const managerRoutes = require('./routes/manager');
const editorRoutes = require('./routes/editor');

dotenv.config();

mongoose.connect('mongodb://localhost:27017/youtuber', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/manager', managerRoutes);
app.use('/editor', editorRoutes);

app.listen(3000, () => {
    console.log("The server is running on port 3000");
});