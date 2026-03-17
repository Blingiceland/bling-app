import React from 'react';

const Footer = () => {
    return (
        <footer style={{
            background: '#080808',
            padding: '60px 40px',
            color: '#888',
            textAlign: 'center',
            borderTop: '1px solid #222'
        }}>
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#fff', fontSize: '32px', marginBottom: '20px' }}>DILLON</h2>
                <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '10px' }}>Laugavegur 30, 101 Reykjavík</p>
                <p>Live music, DJs & whiskey in the heart of Reykjavík</p>
            </div>

            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                <div>
                    <h4 style={{ color: 'var(--color-gold)', marginBottom: '10px' }}>Opening Hours</h4>
                    <p>Sun–Thu: 12:00 – 01:00</p>
                    <p>Fri–Sat: 12:00 – 03:00</p>
                </div>
                <div>
                    <h4 style={{ color: 'var(--color-gold)', marginBottom: '10px' }}>Happy Hour</h4>
                    <p>Every Day: 12:00 – 19:00</p>
                </div>
                <div>
                    <h4 style={{ color: 'var(--color-gold)', marginBottom: '10px' }}>Contact</h4>
                    <p><a href="mailto:dillon@dillon.is">dillon@dillon.is</a></p>
                </div>
            </div>

            <div style={{ fontSize: '14px', borderTop: '1px solid #222', paddingTop: '20px' }}>
                &copy; {new Date().getFullYear()} Dillon Whiskey Bar. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
