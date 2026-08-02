import { useNavigate } from 'react-router-dom'

function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 py-20 px-6 text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-8 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/images/logo.svg" alt="EzPark" className="h-12 w-auto" />
          <span className="text-3xl font-bold text-white">EzPark</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">About Us</h1>
        <p className="text-blue-200 text-lg max-w-xl mx-auto">
          A peer-to-peer parking platform built to solve a real urban problem.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* Problem Statement */}
        <section>
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">The Problem</span>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 mb-6">Urban parking is broken</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: '🚗',
                title: 'Drivers waste time & fuel',
                desc: 'Studies show urban drivers spend an average of 17 minutes searching for parking on every trip — burning fuel, adding stress, and congesting roads.',
              },
              {
                icon: '🏠',
                title: 'Private spaces sit idle',
                desc: 'Millions of privately owned driveways, garage bays, and private lots lie empty for most of the day while nearby streets overflow with circling cars.',
              },
              {
                icon: '💸',
                title: 'Public lots are expensive & impersonal',
                desc: 'Commercial parking charges a premium with no guarantees — spaces can be full, unsafe, or inconveniently located. There is no direct accountability between owner and user.',
              },
              {
                icon: '🔓',
                title: 'No trust layer between strangers',
                desc: 'Existing peer-to-peer solutions lack robust verification — anonymous transactions leave both drivers and space owners exposed to misuse and disputes.',
              },
            ].map((p) => (
              <div key={p.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <span className="text-3xl mb-3 block">{p.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The Solution */}
        <section>
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">The Solution</span>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 mb-4">How EzPark fixes it</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            EzPark is a peer-to-peer parking platform that directly connects drivers looking for a spot
            with private space owners willing to share — safely, transparently, and profitably.
          </p>
          <ul className="space-y-4">
            {[
              'Drivers discover real, privately owned slots on a live map and book them instantly.',
              'Space owners list their idle spots, set their own schedule, and earn passive income with zero effort.',
              'An OTP-based check-in system ensures only the confirmed booking holder can access a space — no strangers, no disputes.',
              'Every transaction is logged end-to-end: bookings, payments, arrivals, and overstays are all tracked and auditable.',
              'Built-in turn-by-turn navigation routes drivers precisely to their booked spot — no circling, no confusion.',
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-gray-600 leading-relaxed">{point}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* About the Project */}
        <section>
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-widest">About the Project</span>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 mb-4">What we built</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            EzPark is a full-featured web application built with React, Vite, and Tailwind CSS.
            It features an interactive Leaflet map for real-time slot discovery, a role-based system
            for both drivers and owners, OTP-secured check-ins, a live booking dashboard, turn-by-turn
            navigation, payment breakdowns, overstay detection, and an in-app rating system.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            The platform is designed to scale — starting as a peer-to-peer prototype, with the
            architecture ready for a production backend, real-time slot data, and payment gateway
            integration.
          </p>
        </section>

        {/* Author */}
        <section className="bg-blue-600 rounded-3xl p-10 text-center text-white">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-white/30">
            <img src="/images/gowtham.jpg" alt="Gowtham" className="w-full h-full object-cover object-top" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Built by Gowtham</h2>
          <p className="text-blue-300 text-sm mb-4">Pre-final year student · Anna University affiliated college · 2026</p>
          <p className="text-blue-100 max-w-xl mx-auto leading-relaxed">
            EzPark was designed, developed, and deployed by Gowtham — driven by a passion for
            solving real urban mobility problems through clean, accessible technology.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition-all"
            >
              Get in touch
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <a
              href="https://www.linkedin.com/in/gowtham81126/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl border border-white/30 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </section>

      </div>
    </div>
  )
}

export default AboutPage
