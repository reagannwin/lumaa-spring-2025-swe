import { Link, useNavigate } from "react-router-dom";
import { authApi, getErrorMessage } from "../api";
import { useAuth } from "../auth/useAuth";
import AuthForm from "./AuthForm";

const Register = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (username: string, password: string) => {
        try {
            await authApi.register(username, password);
            // Sign straight in so the user doesn't have to type it all again.
            await login(username, password);
        } catch (err) {
            throw new Error(getErrorMessage(err, "Registration failed"));
        }
        navigate("/tasks", { replace: true });
    };

    return (
        <AuthForm
            title="Create an account"
            submitLabel="Register"
            onSubmit={handleRegister}
            passwordHint="At least 8 characters. Usernames are 3 to 50 characters."
            footer={
                <>
                    Already have an account? <Link to="/login">Log in</Link>
                </>
            }
        />
    );
};

export default Register;
