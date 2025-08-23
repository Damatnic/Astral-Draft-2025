
import React from 'react';
import Header from '../core/Header';
import Breadcrumbs from '../core/Breadcrumbs';
import MobileNavigation from './MobileNavigation';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <>
            <Header />
            <MobileNavigation />
            <main className="flex-grow pt-24">
                <Breadcrumbs />
                {children}
            </main>
        </>
    );
};

export default MainLayout;
