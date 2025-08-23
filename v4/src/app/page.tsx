export default function HomePage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex min-h-screen flex-col items-center justify-center'>
        <div className='text-center'>
          <h1 className='mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl'>
            Welcome to{' '}
            <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              Astral Draft V4
            </span>
          </h1>
          
          <p className='mb-8 text-lg leading-8 text-gray-600 sm:text-xl'>
            The next generation fantasy football platform built with modern web
            technologies
          </p>

          <div className='flex flex-col gap-4 sm:flex-row sm:justify-center'>
            <button className='btn-primary px-6 py-3'>
              Get Started
            </button>
            <button className='btn-secondary px-6 py-3'>
              Learn More
            </button>
          </div>

          <div className='mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3'>
            <div className='card p-6'>
              <h3 className='mb-2 text-lg font-semibold'>Real-time Drafts</h3>
              <p className='text-gray-600'>
                Experience seamless real-time draft rooms with live updates and
                instant notifications.
              </p>
            </div>
            
            <div className='card p-6'>
              <h3 className='mb-2 text-lg font-semibold'>Advanced Analytics</h3>
              <p className='text-gray-600'>
                Make data-driven decisions with comprehensive player statistics
                and projections.
              </p>
            </div>
            
            <div className='card p-6'>
              <h3 className='mb-2 text-lg font-semibold'>Social Features</h3>
              <p className='text-gray-600'>
                Connect with friends, create leagues, and engage in friendly
                competition.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}