import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/RouteGuards";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Register from "./components/Register";
import Tasks from "./components/Tasks";

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <main className="container">
                    <Routes>
                        <Route element={<PublicOnlyRoute />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route path="/tasks" element={<Tasks />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/tasks" replace />} />
                    </Routes>
                </main>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
