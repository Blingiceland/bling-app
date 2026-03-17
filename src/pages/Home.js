import React from 'react';
// import Hero from '../components/Hero'; // Removed to close gap
import ActionLinks from '../components/ActionLinks';
import InfoSections from '../components/InfoSections';

const Home = () => {
    return (
        <>
            {/* <Hero /> Removed as requested to bring content directly under logo */}
            <ActionLinks />
            <InfoSections />
        </>
    );
};

export default Home;
