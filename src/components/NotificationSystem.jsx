import React, { useState, useEffect } from 'react';
import '../App.css';

const NotificationSystem = ({ notifications, onMarkAsRead, onClearAll }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread') return !notif.read;
        if (filter === 'read') return notif.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            {/* Bildirim İkonu */}
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        position: 'relative'
                    }}
                >
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#ff6b6b',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            border: '2px solid white'
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Bildirim Paneli */}
                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '55px',
                        right: 0,
                        width: '400px',
                        maxHeight: '600px',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Panel Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '2px solid #f0f0f0',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '15px'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                                    <i className="fas fa-bell" style={{ marginRight: '8px' }}></i>
                                    Bildirimler
                                </h3>
                                {onClearAll && (
                                    <button
                                        onClick={onClearAll}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            border: 'none',
                                            color: 'white',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Tümünü Temizle
                                    </button>
                                )}
                            </div>

                            {/* Filtre Butonları */}
                            <div style={{
                                display: 'flex',
                                gap: '8px'
                            }}>
                                <button
                                    onClick={() => setFilter('all')}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: filter === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Tümü ({notifications.length})
                                </button>
                                <button
                                    onClick={() => setFilter('unread')}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: filter === 'unread' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Okunmamış ({unreadCount})
                                </button>
                                <button
                                    onClick={() => setFilter('read')}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: filter === 'read' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Okundu
                                </button>
                            </div>
                        </div>

                        {/* Bildirim Listesi */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            maxHeight: '500px'
                        }}>
                            {filteredNotifications.length === 0 ? (
                                <div style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#999'
                                }}>
                                    <i className="fas fa-bell-slash" style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.3 }}></i>
                                    <p style={{ margin: 0, fontSize: '14px' }}>
                                        {filter === 'unread' ? 'Okunmamış bildirim yok' : 
                                         filter === 'read' ? 'Okunmuş bildirim yok' : 
                                         'Bildirim yok'}
                                    </p>
                                </div>
                            ) : (
                                filteredNotifications.map((notif, index) => (
                                    <div
                                        key={notif.id || index}
                                        onClick={() => !notif.read && onMarkAsRead && onMarkAsRead(notif.id)}
                                        style={{
                                            padding: '15px 20px',
                                            borderBottom: index < filteredNotifications.length - 1 ? '1px solid #f0f0f0' : 'none',
                                            background: notif.read ? 'white' : 'linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = notif.read 
                                                ? 'linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%)' 
                                                : 'linear-gradient(135deg, #e8f4f8 0%, #d4e6f1 100%)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = notif.read 
                                                ? 'white' 
                                                : 'linear-gradient(135deg, #f5f7fa 0%, #e8f4f8 100%)';
                                        }}
                                    >
                                        {!notif.read && (
                                            <div style={{
                                                position: 'absolute',
                                                left: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: '#667eea'
                                            }}></div>
                                        )}
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            paddingLeft: notif.read ? '0' : '20px'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: notif.type === 'success' 
                                                    ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                                                    : notif.type === 'error'
                                                    ? 'linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%)'
                                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '18px',
                                                flexShrink: 0
                                            }}>
                                                <i className={`fas ${notif.icon || 'fa-info-circle'}`}></i>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: notif.read ? '500' : '700',
                                                    color: '#333',
                                                    marginBottom: '4px'
                                                }}>
                                                    {notif.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {notif.message}
                                                </div>
                                                <div style={{
                                                    fontSize: '11px',
                                                    color: '#999',
                                                    marginTop: '6px'
                                                }}>
                                                    {new Date(notif.created_at || Date.now()).toLocaleString('tr-TR', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay - Panel dışına tıklanınca kapanır */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                        background: 'transparent'
                    }}
                />
            )}
        </>
    );
};

export default NotificationSystem;





