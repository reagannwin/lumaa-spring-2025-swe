app.post("/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user to the database
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);

    // Respond with success
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});
