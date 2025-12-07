import React from 'react';

const PaydaLogo = ({ size = 60, showText = true, onClick, darkBackground = false, style = {} }) => {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: showText ? '12px' : '0',
            cursor: onClick ? 'pointer' : 'default',
            transition: onClick ? 'opacity 0.2s ease' : 'none',
            ...style 
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
            if (onClick) {
                e.currentTarget.style.opacity = '0.8';
            }
        }}
        onMouseLeave={(e) => {
            if (onClick) {
                e.currentTarget.style.opacity = '1';
            }
        }}
        >
            <img 
                src="/logo.png" 
                alt="PAYDA Logo"
                style={{
                    width: size,
                    height: size,
                    objectFit: 'contain',
                    display: 'inline-block',
                    verticalAlign: 'middle'
                }}
            />

            {/* PAYDA yazısı - sadece showText true ise */}
            {showText && (
                <span style={{
                    fontSize: size * 0.5,
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '1px'
                }}>
                    PAYDA
                </span>
            )}
        </div>
    );
};

export default PaydaLogo;
