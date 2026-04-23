import mongoose from "mongoose";
import "dotenv/config";
import Shop from "./models/shop.js";
import Lead from "./models/lead.js";
import pluralize from "pluralize";
import { connectDB } from "./config/db.js";

const migrate = async () => {
    try {
        await connectDB();
        
        // 1. Migrate Shops
        const shops = await Shop.find({});
        console.log(`Found ${shops.length} shops.`);
        
        for (const shop of shops) {
            let changed = false;
            shop.products = shop.products.map(p => {
                const plural = pluralize.plural(p.productName.trim());
                if (plural !== p.productName) {
                    console.log(`  [Shop: ${shop.name}] Updating "${p.productName}" -> "${plural}"`);
                    changed = true;
                    return { ...p, productName: plural };
                }
                return p;
            });
            if (changed) {
                await shop.save();
            }
        }

        // 2. Migrate Leads
        const leads = await Lead.find({});
        console.log(`Found ${leads.length} leads.`);
        
        for (const lead of leads) {
            let changed = false;
            if (lead.productInterest && Array.isArray(lead.productInterest)) {
                const updatedInterest = lead.productInterest.map(p => {
                    const plural = pluralize.plural(p.trim());
                    if (plural !== p) {
                        console.log(`  [Lead: ${lead._id}] Updating "${p}" -> "${plural}"`);
                        changed = true;
                        return plural;
                    }
                    return p;
                });
                if (changed) {
                    lead.productInterest = updatedInterest;
                    await lead.save();
                }
            }
        }

        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        mongoose.connection.close();
    }
};

migrate();
