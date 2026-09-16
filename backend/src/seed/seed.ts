import "dotenv/config";
import { connectDB } from "../config/db";
import { Transaction } from "../models/Transaction";
import { User } from "../models/User";
import mongoose from "mongoose";
import rawTransactions from "./transactions.json";

interface RawTransaction {
  id: number;
  date: string;
  amount: number;
  category: "Revenue" | "Expense";
  status: "Paid" | "Pending";
  user_id: string;
  user_profile: string;
}

const run = async () => {
  console.log("[seed] Connecting to database...");
  await connectDB();

  console.log("[seed] Clearing existing transactions...");
  await Transaction.deleteMany({});

  const docs = (rawTransactions as RawTransaction[]).map((t) => ({
    id: t.id,
    date: new Date(t.date),
    amount: t.amount,
    category: t.category,
    status: t.status,
    user_id: t.user_id,
    user_profile: t.user_profile,
  }));

  console.log(`[seed] Inserting ${docs.length} transactions...`);
  await Transaction.insertMany(docs);

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@loopr.dev").toLowerCase();
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    console.log(`[seed] Creating admin user: ${adminEmail}`);
    await User.create({
      name: process.env.SEED_ADMIN_NAME || "Admin User",
      email: adminEmail,
      password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
      role: "admin",
    });
  } else {
    console.log(`[seed] Admin user already exists: ${adminEmail}`);
  }

  console.log("[seed] Done. Summary:");
  console.log(`  - Transactions: ${await Transaction.countDocuments()}`);
  console.log(`  - Users: ${await User.countDocuments()}`);
  console.log(`  - Login with: ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD || "Admin@12345"}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
