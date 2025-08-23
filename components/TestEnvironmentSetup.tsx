/**
 * Test Environment Setup Component
 * Initializes the test league with 10 users on app load
 */

import React from 'react';
import { initializeTestEnvironment, testUsers, testLeague } from '../setup-test-league';
import { useAppState } from '../hooks/useAppState';

export const TestEnvironmentSetup: React.FC = () => {
  const { dispatch } = useAppState();
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Check if already initialized
    const initialized = localStorage.getItem('testEnvironmentInitialized');
    
    if (!initialized || initialized !== '2025') {
      // Initialize test environment
      const { users, league } = initializeTestEnvironment();
      
      // Set up the app state with test data
      dispatch({ 
        type: 'SET_LEAGUES', 
        payload: [league] 
      });
      
      // Set the current user as player 1 (commissioner)
      dispatch({ 
        type: 'SET_USER', 
        payload: users[0] 
      });
      
      // Select the test league
      dispatch({ 
        type: 'SELECT_LEAGUE', 
        payload: league.id 
      });
      
      // Mark as initialized
      localStorage.setItem('testEnvironmentInitialized', '2025');
      setIsInitialized(true);
      
      console.log('✅ Test environment initialized with:');
      console.log('- 10 test users');
      console.log('- 1 test league (Astral Test League 2025)');
      console.log('- Full 2025 NFL player roster');
      console.log('- Current user: The Commissioner');
    } else {
      setIsInitialized(true);
    }
  }, [dispatch]);

  // Quick user switcher for testing
  const switchUser = (userId: string) => {
    const user = testUsers.find(u => u.id === userId);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
      console.log(`Switched to user: ${user.name}`);
    }
  };

  // Development panel (only show in dev mode)
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="bg-gray-900 rounded-lg shadow-xl p-2 text-white">
        <summary className="cursor-pointer text-xs font-bold mb-2">
          🧪 Test Environment {isInitialized ? '✅' : '⏳'}
        </summary>
        <div className="space-y-2 mt-2">
          <p className="text-xs text-gray-400">Quick User Switch:</p>
          <div className="grid grid-cols-2 gap-1">
            {testUsers.map(user => (
              <button
                key={user.id}
                onClick={() => switchUser(user.id)}
                className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                title={`Email: ${user.email}\nPassword: test123`}
              >
                {user.avatar} {user.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <p>League: {testLeague.name}</p>
            <p>Season: 2025</p>
            <p>Teams: 10</p>
            <p>Status: Pre-Draft</p>
          </div>
        </div>
      </details>
    </div>
  );
};

export default TestEnvironmentSetup;