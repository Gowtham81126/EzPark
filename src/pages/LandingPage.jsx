import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  const driverFeatures = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: 'Live Map Discovery',
      description: 'Browse real peer-listed parking slots near you on an interactive map — updated in real time.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Instant Booking',
      description: 'Reserve a slot in seconds and receive a confirmed booking with all owner details.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Turn-by-Turn Navigation',
      description: 'Get routed directly to your booked spot — no guessing, no circling.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Real-Time Availability',
      description: 'See only open slots — availability updates the moment an owner changes it.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      title: 'Transparent Pricing',
      description: 'Full payment breakdown before you confirm — no hidden fees, ever.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      title: 'Rate Your Experience',
      description: 'Leave a review after every booking to help the community find the best spots.',
    },
  ]

  const ownerBenefits = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Earn from Your Idle Space',
      description: "Your driveway, garage, or private lot sits empty most of the day. List it on EzPark and convert that dead space into a steady stream of passive income — on your schedule.",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Full Scheduling Control',
      description: 'Set your own availability windows. Block dates, adjust hours, and manage bookings from your dashboard. You decide when your slot is open — EzPark handles the rest.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Live Booking Dashboard',
      description: 'Track incoming bookings, driver arrivals, overstay alerts, and earnings — all from a single owner dashboard built for clarity.',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Verified Drivers Only',
      description: 'Every driver on EzPark is a registered, verified user. OTP-secured check-ins mean only the confirmed booking holder can access your space.',
    },
  ]

  const steps = [
    { number: '01', title: 'Sign up free', description: 'Create your account in under a minute — as a driver or a space owner.' },
    { number: '02', title: 'Find or list a spot', description: 'Drivers browse the map; owners publish their space with a few taps.' },
    { number: '03', title: 'Book, verify & go', description: 'Confirm your booking, verify with OTP at the spot, and you\'re done.' },
  ]

  const otpPoints = [
    {
      label: 'OTP-verified system',
      detail: 'A unique one-time password is generated for every confirmed booking. The driver presents it on arrival — the slot is handed over only after the code matches, eliminating unauthorized access entirely.',
    },
    {
      label: 'Phone-verified identities',
      detail: 'Every driver and owner on EzPark registers with a verified phone number. There are no anonymous users — every person on the platform is accountable, traceable, and real.',
    },
    {
      label: 'Time-locked slot access',
      detail: 'Bookings are enforced to the minute. Access is only valid within the confirmed window; early arrivals are held and overstays are automatically flagged and penalized — protecting owners around the clock.',
    },
    {
      label: 'Full audit trail',
      detail: 'Every booking, check-in, payment, and status change is logged in an immutable record. Both parties can review the complete history of any transaction, giving full accountability from start to finish.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/logo.svg" alt="EzPark" className="h-9 w-auto" />
            <span className="text-xl font-bold text-white drop-shadow">EzPark</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/about')}
              className="text-sm font-medium text-white hover:text-blue-100 transition-colors px-3 py-2"
            >
              About
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="text-sm font-medium text-white hover:text-blue-100 transition-colors px-3 py-2"
            >
              Contact
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-white hover:text-blue-100 transition-colors px-4 py-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-sm font-semibold bg-white text-blue-600 hover:bg-blue-50 transition-colors px-5 py-2 rounded-full shadow"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/bg.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-800/50 to-blue-900/70" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/30">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Peer-to-peer system
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
            Park smarter,<br />
            <span className="text-blue-300">earn effortlessly.</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 leading-relaxed">
            EzPark connects drivers directly with private space owners — skip the packed public lots, book a verified spot near you, and navigate there in one tap.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-base font-semibold rounded-xl shadow-lg transition-all hover:shadow-blue-500/40 hover:scale-105"
            >
              Get Started — It's Free
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white text-base font-semibold rounded-xl border border-white/40 transition-all"
            >
              Login to Your Account
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center gap-1 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Driver Features ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">For Drivers</span>
            <h2 className="mt-2 text-4xl font-bold text-gray-900">Everything you need to park with ease</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              From discovery to directions — EzPark handles every step of your parking journey.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {driverFeatures.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl shadow transition-all hover:scale-105"
            >
              Find Parking
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Owner Advantages ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">For Space Owners</span>
            <h2 className="mt-2 text-4xl font-bold text-gray-900">Turn your empty space into income</h2>
            <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
              Whether you own a driveway, a garage bay, or a private lot, EzPark gives you the tools to list it, manage bookings, and earn — entirely on your terms.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ownerBenefits.map((b) => (
              <div
                key={b.title}
                className="flex gap-5 p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all bg-gray-50"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
                  {b.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl shadow transition-all hover:scale-105"
            >
              List Your Space
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── OTP Security ── */}
      <section className="py-24 bg-gradient-to-br from-blue-900 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left text */}
            <div className="lg:w-1/2">
              <span className="text-sm font-semibold text-blue-300 uppercase tracking-widest">Security</span>
              <h2 className="mt-2 text-4xl font-bold text-white leading-tight mb-6">
                OTP-secured handoffs — unlike any traditional parking system
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed mb-6">
                Traditional parking relies on anonymous tickets and unmanned barriers — anyone with a token can enter. EzPark replaces that with a one-time password (OTP) system that ties every booking to a specific, verified person.
              </p>
              <p className="text-blue-200 text-base leading-relaxed">
                The OTP is generated the moment a booking is confirmed and expires at the end of the booked slot. No code, no access — it's that simple.
              </p>
            </div>
            {/* Right cards */}
            <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              {otpPoints.map((p) => (
                <div key={p.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-white font-semibold text-sm">{p.label}</h4>
                  </div>
                  <p className="text-blue-200 text-sm leading-relaxed">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">How it works</span>
            <h2 className="mt-2 text-4xl font-bold text-gray-900">Parked in three easy steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <span className="text-7xl font-black text-blue-100 select-none leading-none">{step.number}</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shadow">
                      {i + 1}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to find your spot?</h2>
          <p className="text-blue-100 text-lg mb-10">
            Join EzPark to save time and money.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 text-base font-semibold rounded-xl shadow transition-all hover:scale-105"
            >
              Create a Free Account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-base font-semibold rounded-xl border border-white/30 transition-all"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">© 2026 EzPark</p>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
