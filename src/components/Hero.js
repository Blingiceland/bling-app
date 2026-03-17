import React from 'react';

// using external image for now
const heroImg = "https://images.unsplash.com/photo-1514362545857-3bc16549766b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80";

const Hero = () => {
    return (
        <div style={{
            height: '100vh',
            width: '100%',
            backgroundImage: `url(${heroImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            // No content overlay as requested
        }} />
    );
};

export default Hero;
