const { supabase } = require("../config/supabase");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required",
      });
    }

    const { data: existingUsers, error: searchError } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`);

    if (searchError) {
      console.error("Search error:", searchError);
      return res.status(500).json({ error: "Error checking existing user" });
    }

    if (existingUsers && existingUsers.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        username,
        email,
        password_hash,
        role: "member",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return res.status(500).json({ error: "Failed to create user" });
    }

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    delete newUser.password_hash;

    res.status(201).json({
      message: "User registered successfully",
      data: newUser,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal server error during registration",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const { data: users, error: searchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (searchError) {
      console.error("Search error:", searchError);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users && users[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    delete user.password_hash;

    res.json({
      data: user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error during login",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
