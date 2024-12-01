const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error) throw error;
    console.log("Supabase connection successful");
  } catch (error) {
    console.error("Supabase connection error:", error.message);
  }
};

testConnection();

module.exports = supabase;
