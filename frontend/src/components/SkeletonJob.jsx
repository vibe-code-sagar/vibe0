import React from 'react';

export default function SkeletonJob() {
    return (
        <div className="jobCard" style={{ cursor: 'default' }}>
            <div className="skeleton skeleton--line skeleton--line-lg" style={{ width: '70%' }} />
            <div className="skeleton skeleton--line" style={{ width: '45%' }} />
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton skeleton--line" style={{ width: '30%', marginBottom: 0 }} />
                <div className="skeleton skeleton--line" style={{ width: '20%', marginBottom: 0 }} />
            </div>
        </div>
    );
}
