import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginUser(email, password);
            login(data.access_token, email);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="authPage">
            <div className="authCard">
                <div className="authCard__header">
                    <div className="brandMark brandMark--lg" aria-hidden="true">AI</div>
                    <h2 className="authCard__title">Welcome Back</h2>
                    <p className="authCard__subtitle">Sign in to your account</p>
                </div>

                {error && <div className="errorBanner">{error}</div>}

                <form onSubmit={handleSubmit} className="authForm">
                    <div className="field">
                        <label className="label" htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="field">
                        <label className="label" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="current-password"
                        />
                    </div>
                    <button className="btn btnPrimary btn--full" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner spinner--sm spinner--white" aria-hidden="true" />
                                Signing in…
                            </>
                        ) : 'Sign In'}
                    </button>
                </form>

                <p className="authCard__footer">
                    Don't have an account? <Link to="/register" className="authLink">Create one</Link>
                </p>
            </div>
        </div>
    );
}
