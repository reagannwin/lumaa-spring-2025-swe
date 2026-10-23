import { FormEvent, ReactNode, useState } from "react";

interface AuthFormProps {
    title: string;
    submitLabel: string;
    onSubmit: (username: string, password: string) => Promise<void>;
    passwordHint?: string;
    footer: ReactNode;
}

// Shared by Login and Register so the two forms behave the same way.
const AuthForm = ({ title, submitLabel, onSubmit, passwordHint, footer }: AuthFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await onSubmit(username.trim(), password);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsSubmitting(false);
        }
    };

    return (
        <section className="card auth-card">
            <h1>{title}</h1>
            {error && (
                <p className="error" role="alert">
                    {error}
                </p>
            )}
            <form onSubmit={handleSubmit} className="stack">
                <label>
                    Username
                    <input
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        autoComplete={passwordHint ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {passwordHint && <small className="hint">{passwordHint}</small>}
                </label>
                <button type="submit" className="primary" disabled={isSubmitting}>
                    {isSubmitting ? "Please wait..." : submitLabel}
                </button>
            </form>
            <p className="muted">{footer}</p>
        </section>
    );
};

export default AuthForm;
