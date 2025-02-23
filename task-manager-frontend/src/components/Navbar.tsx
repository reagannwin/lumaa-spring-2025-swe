import React from "react";
import { Link } from "react-router-dom";
import { isAuthenticated, logout } from "../utils/auth";

const Navbar: React.FC = () => {
    return (
        <nav>
            <Link to="/">Home</Link>
            {isAuthenticated() ? (
                <>
                    <Link to="/tasks">Tasks</Link> {/* Add this line */}
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </>
            )}
        </nav>
    );
};

export default Navbar;