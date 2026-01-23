import React from 'react';

const Analytics = () => {
    // Placeholder URL - User needs to replace this
    const embedUrl = "https://app.powerbi.com/view?r=eyJrIjoiMjAyMy1HYW1lLW9mLVRocm9uZXMiLCJ0IjoiNzcyNTFmOGQtN2Y2MC00NzZmLTkwNDctTS0wNzFjYjcxMzQifQ%3D%3D";

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ marginBottom: '20px' }}>Election Analytics</h1>

            <div className="analytics-container"
                style={{
                    flex: 1,
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: 'var(--glass-shadow)',
                    overflow: 'hidden'
                }}
            >
                <iframe
                    title="Votex Analytics"
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    frameBorder="0"
                    allowFullScreen={true}
                ></iframe>
            </div>
        </div>
    );
};

export default Analytics;
