import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import {
  Comment,
  ContactMessage,
  DealReport,
  OtpVerification,
  RetailerCollaborationRequest,
  Review,
  SavedDeal,
  SecurityEvent,
  User,
} from "../src/models/index.js";

const models = [
  User,
  OtpVerification,
  SavedDeal,
  Review,
  Comment,
  DealReport,
  RetailerCollaborationRequest,
  ContactMessage,
  SecurityEvent,
];

try {
  const connection = await connectDatabase();
  for (const model of models) {
    await model.createIndexes();
    console.log(`Indexes ready: ${model.modelName}`);
  }
  console.log(`Database indexes created in "${connection.name}".`);
} finally {
  await mongoose.disconnect();
}
