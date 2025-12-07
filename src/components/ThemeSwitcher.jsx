import React, { useState, useEffect } from 'react';
import '../App.css';

const themes = {
    default: {
        name: 'Varsayılan',
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        sidebar: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
        accent: '#667eea'
    },
    blue: {
        name: 'Mavi',
        primary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        secondary: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
        sidebar: 'linear-gradient(180deg, #0277bd 0%, #0288d1 100%)',
        accent: '#4facfe'
    },
    green: {
        name: 'Yeşil',
        primary: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
        secondary: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        sidebar: 'linear-gradient(180deg, #2e7d32 0%, #388e3c 100%)',
        accent: '#56ab2f'
    },
    orange: {
        name: 'Turuncu',
        primary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        secondary: 'linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%)',
        sidebar: 'linear-gradient(180deg, #e64a19 0%, #ff5722 100%)',
        accent: '#f5576c'
    },
    purple: {
        name: 'Mor',
        primary: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        secondary: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
        sidebar: 'linear-gradient(180deg, #7b1fa2 0%, #9c27b0 100%)',
        accent: '#9c27b0'
    }
};

const ThemeSwitcher = ({ onThemeChange }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('appTheme') || 'default';
    });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('appTheme', currentTheme);
        if (onThemeChange) {
            onThemeChange(themes[currentTheme]);
        }
    }, [currentTheme, onThemeChange]);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    padding: '10px 15px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontWeight: '600'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
                <i className="fas fa-palette"></i>
                <span>Tema</span>
            </button>

            {isOpen && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '50px',
                        right: 0,
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        padding: '15px',
                        zIndex: 9999,
                        minWidth: '200px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            marginBottom: '10px',
                            color: '#333'
                        }}>
                            Tema Seç
                        </div>
                        {Object.entries(themes).map(([key, theme]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setCurrentTheme(key);
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    marginBottom: '8px',
                                    background: currentTheme === key ? theme.primary : '#f5f5f5',
                                    color: currentTheme === key ? 'white' : '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: currentTheme === key ? '700' : '400',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    if (currentTheme !== key) {
                                        e.target.style.background = '#e0e0e0';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentTheme !== key) {
                                        e.target.style.background = '#f5f5f5';
                                    }
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '4px',
                                    background: theme.primary
                                }}></div>
                                {theme.name}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ThemeSwitcher;
export { themes };





