require('dotenv').config({ path: './.env' })
const mongoose = require('mongoose')
const uri = process.env.MONGODB_URI || process.env.MONGO_URI
console.log('Testing connection to:', uri ? uri.replace(/:[^:@]+@/, ':***@').slice(0,200) : 'NO_URI')
mongoose
  .connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('CONNECTED')
    return mongoose.disconnect()
  })
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('CONNECT_ERROR:')
    console.error(e)
    process.exit(1)
  })
