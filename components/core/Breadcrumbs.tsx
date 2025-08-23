
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { View } from '../../types';

const viewHierarchy: { [key in View]?: { parent: View, name: string } } = {
    LEAGUE_HUB: { parent: 'DASHBOARD', name: 'League Hub' },
    TEAM_HUB: { parent: 'LEAGUE_HUB', name: 'Team Hub' },
    LEAGUE_STANDINGS: { parent: 'LEAGUE_HUB', name: 'Standings' },
    COMMISSIONER_TOOLS: { parent: 'LEAGUE_HUB', name: 'Commissioner Tools' },
    EDIT_LEAGUE_SETTINGS: { parent: 'COMMISSIONER_TOOLS', name: 'Edit Settings' },
};

const viewNames: { [key in View]?: string } = {
    DASHBOARD: 'Dashboard',
};


const Breadcrumbs: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { currentView } = state;

    const buildBreadcrumbs = () => {
        const crumbs: { name: string, view: View }[] = [];
        let view: View | undefined = currentView;

        while(view) {
            const hierarchy: { parent: View, name: string } | undefined = viewHierarchy[view];
            const name = hierarchy?.name || viewNames[view] || view.replace(/_/g, ' ');
            crumbs.unshift({ name, view });
            view = hierarchy?.parent;
        }
        return crumbs;
    }

    const breadcrumbs = buildBreadcrumbs();

    if (breadcrumbs.length <= 1) {
        return null; // Don't show on top-level views
    }
    
    return (
        <nav className="px-8 pb-4 text-sm text-gray-400 flex items-center gap-2">
           {breadcrumbs.map((crumb, index) => (
               <React.Fragment key={index}>
                   {index > 0 && <span>/</span>}
                   <button
                       onClick={() => dispatch({ type: 'SET_VIEW', payload: crumb.view })}
                       className={`hover:text-white ${index === breadcrumbs.length - 1 ? 'font-bold text-white' : ''}`}
                   >
                       {crumb.name}
                   </button>
               </React.Fragment>
           ))}
        </nav>
    );
};

export default Breadcrumbs;
