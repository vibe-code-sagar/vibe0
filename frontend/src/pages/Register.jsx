import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await registerUser(email, password);
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="authPage">
            <div className="authCard">
                <div className="authCard__header">
                    <div className="brandMark brandMark--lg" aria-hidden="true">AI</div>
                    <h2 className="authCard__title">Create Account</h2>
                    <p className="authCard__subtitle">Start tracking your job applications</p>
                </div>

                {error && <div className="errorBanner">{error}</div>}

                <form onSubmit={handleSubmit} className="authForm">
                    <div className="field">
                        <label className="label" htmlFor="reg-email">Email</label>
                        <input
                            id="reg-email"
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
                        <label className="label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            className="input"
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="field">
                        <label className="label" htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>
                    <button className="btn btnPrimary btn--full" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner spinner--sm spinner--white" aria-hidden="true" />
                                Creating account…
                            </>
                        ) : 'Create Account'}
                    </button>
                </form>

                <p className="authCard__footer">
                    Already have an account? <Link to="/login" className="authLink">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
