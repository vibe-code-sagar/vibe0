import React from 'react';

export default function Spinner({ size = 'medium', color = 'primary' }) {
    const sizeClass = {
        small: 'spinner--sm',
        medium: 'spinner--md',
        large: 'spinner--lg',
    }[size] || 'spinner--md';

    const colorClass = {
        primary: 'spinner--primary',
        white: 'spinner--white',
    }[color] || 'spinner--primary';

    return (
        <span
            className={`spinner ${sizeClass} ${colorClass}`}
            role="status"
            aria-label="loading"
        />
    );
}
