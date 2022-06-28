import mongoose from 'mongoose';
/* const connectDB = handler => async (req, res) => {
  if (mongoose.connections[0].readyState) {
    // Use current db connection
    return handler(req, res);
  }
  // Use new db connection
  await mongoose.connect(process.env.MONGODB_URI, {});
  console.log('Connected to MongoDB');
  return handler(req, res);
};

export default connectDB; */

// This function can be marked `async` if using `await` inside
export async function middleware(request) {
  if (mongoose.connections[0].readyState) {
    // Use current db connection
    return Response("db connected");
  }
  // Use new db connection
  await mongoose.connect(process.env.MONGODB_URI, {});
  console.log('Connected to MongoDB');
  return Response("db connected");
  }
