import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

/** Only for signed-in users; everyone else goes to /login. */
export const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
};

/** Login and register pages; signed-in users skip straight to their tasks. */
export const PublicOnlyRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/tasks" replace /> : <Outlet />;
};
