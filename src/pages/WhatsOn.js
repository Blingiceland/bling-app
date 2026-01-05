import React, { useEffect, useState } from 'react';
import { fetchEvents } from '../utils/googleSheet';

const WhatsOn = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getEvents = async () => {
            const data = await fetchEvents();
            // Filter out past events? Or keep them? Usually remove past events.
            // Let's filter for events from yesterday onwards (to include today's events)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const upcoming = data.filter(e => e.dateObj > yesterday);
            setEvents(upcoming);
            setLoading(false);
        };
        getEvents();
    }, []);

    return (
        <div style={{ paddingTop: '50px', minHeight: '100vh', paddingBottom: '100px', backgroundColor: '#000', color: '#fff' }}>
            <div style={{ maxWidth: '1000px', width: '95%', margin: '0 auto', textAlign: 'center' }}>
                <h1 className="text-gold" style={{ fontSize: '3.5rem', marginBottom: '40px', fontFamily: 'var(--font-heading)', letterSpacing: '2px' }}>Upcoming Events</h1>

                {loading ? (
                    <div className="text-gold" style={{ fontSize: '1.2rem' }}>Loading events...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
                        {events.length === 0 && <p>No upcoming events scheduled.</p>}

                        {events.map(event => (
                            <div key={event.id} style={{
                                width: '100%',
                                border: '1px solid rgba(200, 155, 60, 0.3)',
                                background: '#111',
                                padding: '30px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                textAlign: 'left',
                                transition: 'border-color 0.3s'
                            }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#C89B3C'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(200, 155, 60, 0.3)'}
                            >
                                {/* Flex Container for Row Layout on Desktop */}
                                <div style={{ display: 'flex', flexDirection: 'column', md: { flexDirection: 'row' }, gap: '20px', width: '100%', flexWrap: 'wrap' }} className="event-row">
                                    <style>{`
                                        .event-row { flex-direction: column; }
                                        @media (min-width: 768px) {
                                            .event-row { flex-direction: row !important; align-items: center; justify-content: space-between; }
                                            .event-date { width: 25%; }
                                            .event-info { flex: 1; padding: 0 20px; }
                                            .event-action { width: 25%; text-align: right; }
                                        }
                                    `}</style>

                                    {/* Date & Time */}
                                    <div className="event-date" style={{ textAlign: 'center', minWidth: '150px' }}>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', lineHeight: 1.2 }}>{event.dateDisplay}</h3>
                                        <p className="text-gold" style={{ margin: '5px 0 0 0', fontSize: '1.2rem' }}>{event.time}</p>
                                    </div>

                                    {/* Title & Entry */}
                                    <div className="event-info" style={{ textAlign: 'center', md: { textAlign: 'left' } }}>
                                        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{event.title}</h2>
                                        <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0 }}>
                                            Entry: <span style={{ color: '#fff' }}>{event.entry}</span>
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <div className="event-action" style={{ display: 'flex', justifyContent: 'center', md: { justifyContent: 'flex-end' } }}>
                                        {event.status === 'buy' && (
                                            <a
                                                href={event.ticketsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ padding: '10px 24px', background: '#C89B3C', color: '#000', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', border: 'none', cursor: 'pointer', display: 'inline-block' }}
                                            >
                                                Buy Tickets
                                            </a>
                                        )}
                                        {event.status === 'door' && (
                                            <div style={{ padding: '10px 24px', border: '1px solid #fff', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'default' }}>
                                                Tickets at Door
                                            </div>
                                        )}
                                        {event.status === 'free' && (
                                            <div style={{ padding: '10px 24px', border: '1px solid #C89B3C', color: '#C89B3C', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'default' }}>
                                                Free Entry
                                            </div>
                                        )}
                                        {event.status === 'none' && (
                                            <div style={{ padding: '10px 24px', colors: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'default' }}>
                                                -
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsOn;
