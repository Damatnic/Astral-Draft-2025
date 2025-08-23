'use client'

import React, { useState } from 'react'

export const DesignSystemShowcase = () => {
  const [activeTab, setActiveTab] = useState('buttons')

  return (
    <div className="min-h-screen p-8 space-y-12">
      {/* Header */}
      <header className="text-center space-y-4">
        <h1 className="text-6xl font-display text-gradient-neon">
          Astral Draft V4 Design System
        </h1>
        <p className="text-xl text-gray-400 font-body">
          Premium Cyberpunk Gaming Experience
        </p>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex justify-center space-x-2">
        {['buttons', 'cards', 'inputs', 'text', 'badges', 'alerts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-link px-6 py-3 rounded-lg capitalize ${
              activeTab === tab ? 'active' : ''
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'buttons' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-heading text-glow-purple mb-6">Button Variants</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Primary Buttons</h3>
                <button className="btn-primary w-full">Primary Action</button>
                <button className="btn-primary w-full" disabled>Disabled Primary</button>
              </div>

              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Neon Buttons</h3>
                <button className="btn-neon w-full">Neon Action</button>
                <button className="btn-neon w-full" disabled>Disabled Neon</button>
              </div>

              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Ghost Buttons</h3>
                <button className="btn-ghost w-full">Ghost Action</button>
                <button className="btn-ghost w-full" disabled>Disabled Ghost</button>
              </div>
            </div>

            {/* Animated Buttons */}
            <div className="card-holographic p-6 space-y-4">
              <h3 className="text-xl font-display text-cyan-400">Special Effects</h3>
              <div className="flex flex-wrap gap-4">
                <button className="btn-primary animate-pulse">Pulsing</button>
                <button className="btn-neon animate-shimmer">Shimmer</button>
                <button className="btn-ghost animate-float">Floating</button>
                <button className="btn-primary glow-purple">Purple Glow</button>
                <button className="btn-neon glow-cyan">Cyan Glow</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'cards' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-heading text-glow-purple mb-6">Card Components</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card-glass p-6">
                <h3 className="text-xl font-display text-cyan-400 mb-3">Glass Card</h3>
                <p className="text-gray-300">Standard glassmorphism card with blur effect and subtle borders.</p>
              </div>

              <div className="card-glass-hover p-6">
                <h3 className="text-xl font-display text-cyan-400 mb-3">Hover Card</h3>
                <p className="text-gray-300">Interactive card with hover effects and elevation changes.</p>
              </div>

              <div className="card-holographic p-6">
                <h3 className="text-xl font-display text-cyan-400 mb-3">Holographic</h3>
                <p className="text-gray-300">Animated holographic effect with shifting gradients.</p>
              </div>

              <div className="stat-card">
                <div className="stat-label">Total Points</div>
                <div className="stat-value">1,337</div>
                <p className="text-sm text-gray-500 mt-2">+12.5% from last week</p>
              </div>

              <div className="card-glass border-gradient-animated p-6">
                <h3 className="text-xl font-display text-cyan-400 mb-3">Animated Border</h3>
                <p className="text-gray-300">Card with animated gradient border effect.</p>
              </div>

              <div className="card-glass perspective-card p-6">
                <h3 className="text-xl font-display text-cyan-400 mb-3">3D Perspective</h3>
                <p className="text-gray-300">Card with 3D perspective transform on hover.</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'inputs' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-heading text-glow-purple mb-6">Input Fields</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Neon Inputs</h3>
                <input type="text" className="input-neon" placeholder="Enter username..." />
                <input type="email" className="input-neon" placeholder="Enter email..." />
                <input type="password" className="input-neon" placeholder="Enter password..." />
                <textarea className="input-neon" rows={4} placeholder="Enter message..." />
              </div>

              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Select & Search</h3>
                <select className="input-neon">
                  <option>Select League</option>
                  <option>Premier League</option>
                  <option>Championship League</option>
                  <option>Dynasty League</option>
                </select>
                <input type="search" className="input-neon" placeholder="Search players..." />
                <input type="number" className="input-neon" placeholder="Enter amount..." />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'text' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-heading text-glow-purple mb-6">Typography Effects</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Gradient Text</h3>
                <p className="text-gradient-purple-cyan text-2xl font-bold">Purple to Cyan Gradient</p>
                <p className="text-gradient-neon text-2xl font-bold">Animated Neon Gradient</p>
                <p className="text-holographic text-2xl font-bold">Holographic Shimmer</p>
              </div>

              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Glow Effects</h3>
                <p className="text-glow-purple text-2xl font-bold">Purple Glow Text</p>
                <p className="text-glow-cyan text-2xl font-bold">Cyan Glow Text</p>
                <p className="text-chrome text-2xl font-bold">Chrome Text Effect</p>
              </div>

              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Special Effects</h3>
                <p className="glitch text-2xl font-bold" data-text="GLITCH EFFECT">GLITCH EFFECT</p>
                <p className="perspective-text text-2xl font-bold">3D PERSPECTIVE</p>
                <p className="matrix-text text-2xl font-mono">MATRIX_RAIN_01</p>
              </div>

              <div className="card-glass p-6 space-y-4">
                <h3 className="text-xl font-display text-cyan-400">Font Families</h3>
                <p className="font-display text-xl">Orbitron Display</p>
                <p className="font-heading text-2xl">BEBAS NEUE HEADING</p>
                <p className="font-body text-xl">Rajdhani Body Text</p>
                <p className="font-mono text-lg">Space_Mono(code)</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'badges' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-heading text-glow-purple mb-6">Badges & Pills</h2>
            
            <div className="card-glass p-6 space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="badge-success">SUCCESS</span>
                <span className="badge-warning">WARNING</span>
                <span className="badge-danger">DANGER</span>
                <span className="badge-info">INFO</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="badge bg-gradient-to-r from-purple-500 to-pink-500 text-white">PREMIUM</span>
                <span className="badge bg-gradient-to-r from-cyan-500 to-blue-500 text-white">PRO</span>
                <span className="badge bg-gradient-to-r from-green-500 to-emerald-500 text-white">ONLINE</span>
                <span className="badge bg-gradient-to-r from-orange-500 to-red-500 text-white">LIVE</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="badge border-2 border-purple-500 bg-transparent text-purple-400">OUTLINED</span>
                <span className="badge border-2 border-cyan-500 bg-transparent text-cyan-400 animate-pulse">PULSING</span>
                <span className="badge border-2 border-pink-500 bg-transparent text-pink-400 glow-pink">GLOWING</span>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'alerts' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-heading text-glow-purple mb-6">Alerts & Notifications</h2>
            
            <div className="space-y-4">
              <div className="alert-success">
                <h4 className="font-display text-lg text-green-400 mb-1">Success!</h4>
                <p className="text-gray-300">Your draft pick was successfully submitted.</p>
              </div>

              <div className="alert-warning">
                <h4 className="font-display text-lg text-yellow-400 mb-1">Warning</h4>
                <p className="text-gray-300">Your roster has an injured player in the starting lineup.</p>
              </div>

              <div className="alert-error">
                <h4 className="font-display text-lg text-red-400 mb-1">Error</h4>
                <p className="text-gray-300">Failed to process trade. Please try again.</p>
              </div>

              <div className="alert-info">
                <h4 className="font-display text-lg text-blue-400 mb-1">Information</h4>
                <p className="text-gray-300">Draft starts in 15 minutes. Get ready!</p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Additional Components */}
      <section className="space-y-8">
        <h2 className="text-3xl font-heading text-glow-purple mb-6">Additional Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Progress Bar */}
          <div className="card-glass p-6">
            <h3 className="text-xl font-display text-cyan-400 mb-4">Progress Bar</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '65%' }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">65% Complete</p>
          </div>

          {/* Loading Spinner */}
          <div className="card-glass p-6 flex flex-col items-center">
            <h3 className="text-xl font-display text-cyan-400 mb-4">Loading Spinner</h3>
            <div className="spinner-neon"></div>
          </div>

          {/* Skeleton Loader */}
          <div className="card-glass p-6">
            <h3 className="text-xl font-display text-cyan-400 mb-4">Skeleton Loader</h3>
            <div className="space-y-3">
              <div className="skeleton h-4 w-full rounded"></div>
              <div className="skeleton h-4 w-3/4 rounded"></div>
              <div className="skeleton h-4 w-1/2 rounded"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="space-y-8">
        <h2 className="text-3xl font-heading text-glow-purple mb-6">Color Palette</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="card-glass p-4 text-center">
            <div className="w-full h-20 rounded bg-gradient-to-br from-purple-500 to-purple-700 mb-2"></div>
            <p className="text-xs font-mono">Purple</p>
          </div>
          <div className="card-glass p-4 text-center">
            <div className="w-full h-20 rounded bg-gradient-to-br from-cyan-400 to-cyan-600 mb-2"></div>
            <p className="text-xs font-mono">Cyan</p>
          </div>
          <div className="card-glass p-4 text-center">
            <div className="w-full h-20 rounded bg-gradient-to-br from-pink-500 to-pink-700 mb-2"></div>
            <p className="text-xs font-mono">Pink</p>
          </div>
          <div className="card-glass p-4 text-center">
            <div className="w-full h-20 rounded bg-gradient-to-br from-blue-500 to-blue-700 mb-2"></div>
            <p className="text-xs font-mono">Blue</p>
          </div>
          <div className="card-glass p-4 text-center">
            <div className="w-full h-20 rounded bg-gradient-to-br from-green-400 to-green-600 mb-2"></div>
            <p className="text-xs font-mono">Green</p>
          </div>
          <div className="card-glass p-4 text-center">
            <div className="w-full h-20 rounded bg-gradient-to-br from-orange-500 to-orange-700 mb-2"></div>
            <p className="text-xs font-mono">Orange</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DesignSystemShowcase