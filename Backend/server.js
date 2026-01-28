// start server
const app=require('./src/app');
const connectDB=require('./src/db/db');
require('dotenv').config();

 connectDB(); // Connect to the database

const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`server started at port ${PORT}`);
});