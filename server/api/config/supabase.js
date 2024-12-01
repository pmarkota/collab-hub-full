const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log("Initializing Supabase with URL:", supabaseUrl);

// Create Supabase clients
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Export the database client specifically for queries
const supabase = supabaseClient;
const supabaseAdminDb = supabaseAdmin;

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("teams").select("count");
    if (error) throw error;
    console.log("Supabase connection successful");
  } catch (error) {
    console.error("Supabase connection error:", error);
  }
};

// Run the test
testConnection();

module.exports = {
  supabase,
  supabaseAdmin: supabaseAdminDb,
  supabaseClient, // Full client for realtime features
  supabaseAdminClient: supabaseAdmin, // Full admin client for storage operations
};
