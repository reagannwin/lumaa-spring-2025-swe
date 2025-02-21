app.post("/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (user.rowCount === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate a token
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Respond with token
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "An error occurred" });
    }
});
