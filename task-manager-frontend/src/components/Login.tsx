import { Link, useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api";
import { useAuth } from "../auth/useAuth";
import AuthForm from "./AuthForm";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from || "/tasks";

    const handleLogin = async (username: string, password: string) => {
        try {
            await login(username, password);
        } catch (err) {
            throw new Error(getErrorMessage(err, "Login failed"));
        }
        navigate(from, { replace: true });
    };

    return (
        <AuthForm
            title="Log in"
            submitLabel="Log in"
            onSubmit={handleLogin}
            footer={
                <>
                    No account yet? <Link to="/register">Register</Link>
                </>
            }
        />
    );
};

export default Login;
