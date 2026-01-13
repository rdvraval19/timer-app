import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentTime, setCurrentTime] = useState(0);
  const [setTime, setSetTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [previousTime, setPreviousTime] = useState(0);

  const API_URL = 'http://localhost:5000/api/timer';

  // Poll timer status every 100ms for smooth updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        
        // Check if timer just completed (was 1, now 0, and was running)
        if (previousTime === 1 && data.current_time === 0 && data.is_running) {
          playNotificationSound();
          showNotification();
        }
        
        setPreviousTime(data.current_time);
        setCurrentTime(data.current_time);
        setSetTime(data.set_time);
        setIsRunning(data.is_running);
      } catch (error) {
        console.error('Error fetching timer status:', error);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [previousTime]);

  const playNotificationSound = () => {
    // Create audio context for bell sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Bell-like sound frequencies
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
    
    // Play twice for "ding ding"
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.setValueAtTime(800, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 1);
    }, 150);
  };

  const showNotification = () => {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete! ⏰', {
        body: 'Your timer has finished!',
        icon: '⏰',
        badge: '⏰'
      });
    }
    
    // Visual alert
    document.body.classList.add('timer-complete-flash');
    setTimeout(() => {
      document.body.classList.remove('timer-complete-flash');
    }, 1000);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStart = async () => {
    try {
      const response = await fetch(`${API_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes, seconds })
      });
      await response.json();
      setShowInput(false);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${API_URL}/stop`, { method: 'POST' });
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handlePauseResume = async () => {
    try {
      await fetch(`${API_URL}/pause`, { method: 'POST' });
    } catch (error) {
      console.error('Error pausing/resuming timer:', error);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_URL}/reset`, { method: 'POST' });
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60) % 60;
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      {/* About Button - Top Right */}
      <button className="about-button" onClick={() => setShowAbout(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4M12 8h.01"></path>
        </svg>
        About
      </button>

      <div className="backdrop">
        <div className="timer-container">
          <div className="app-header">
            <h1 className="app-title">⏰ Timer App</h1>
            <p className="app-subtitle">Stay Focused, Stay Productive</p>
          </div>
          
          <h1 className="timer-display">
            {formatTime(currentTime)}
            {currentTime === 0 && previousTime !== 0 && (
              <span className="complete-indicator">✓</span>
            )}
          </h1>
          
          <div className="button-container">
            <button 
              className="timer-button start-button"
              onClick={() => setShowInput(!showInput)}
            >
              <span className="button-icon">▶</span>
              START
            </button>
            
            <button 
              className="timer-button stop-button"
              onClick={handleStop}
            >
              <span className="button-icon">■</span>
              STOP
            </button>
            
            <button 
              className="timer-button pause-button"
              onClick={handlePauseResume}
            >
              <span className="button-icon">{isRunning ? '❚❚' : '▶'}</span>
              {isRunning ? 'PAUSE' : 'RESUME'}
            </button>
            
            <button 
              className="timer-button reset-button"
              onClick={handleReset}
            >
              <span className="button-icon">↻</span>
              RESET
            </button>
          </div>

          {showInput && (
            <div className="time-input-modal">
              <div className="time-input-container">
                <h2>⏱️ Set Timer</h2>
                <div className="input-group">
                  <label>
                    Minutes
                    <input 
                      type="number" 
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </label>
                  <label>
                    Seconds
                    <input 
                      type="number" 
                      value={seconds}
                      onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                      min="0"
                      max="59"
                    />
                  </label>
                </div>
                <div className="input-buttons">
                  <button onClick={handleStart} className="confirm-button">Start Timer</button>
                  <button onClick={() => setShowInput(false)} className="cancel-button">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LinkedIn Banner */}
      <div className="linkedin-banner">
        <div className="banner-content">
          <span className="banner-text">💼 Built with passion | Connect with me on</span>
          <a 
            href="https://www.linkedin.com/in/your-profile" 
            target="_blank" 
            rel="noopener noreferrer"
            className="linkedin-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </a>
          <span className="banner-text-mobile">Made by [Your Name]</span>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="about-modal" onClick={() => setShowAbout(false)}>
          <div className="about-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowAbout(false)}>×</button>
            
            <h2>⏰ Timer App</h2>
            <p className="about-description">
              A modern web-based countdown timer built with a full-stack architecture. 
              Originally designed as a Pygame application, now reimagined for the web!
            </p>

            <div className="tech-stack">
              <h3>🛠️ Tech Stack</h3>
              <div className="tech-grid">
                <div className="tech-item">
                  <span className="tech-icon">⚛️</span>
                  <div>
                    <strong>React 18</strong>
                    <p>Frontend UI framework</p>
                  </div>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">⚡</span>
                  <div>
                    <strong>Vite</strong>
                    <p>Build tool & dev server</p>
                  </div>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🐍</span>
                  <div>
                    <strong>Python Flask</strong>
                    <p>Backend REST API</p>
                  </div>
                </div>
                <div className="tech-item">
                  <span className="tech-icon">🔄</span>
                  <div>
                    <strong>REST API</strong>
                    <p>Client-server communication</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="features">
              <h3>✨ Features</h3>
              <ul>
                <li>🎯 Precise countdown timer (1-second intervals)</li>
                <li>⏸️ Pause/Resume functionality</li>
                <li>🔄 Reset to original time</li>
                <li>🔔 Audio + visual notifications on completion</li>
                <li>📱 Responsive design (works on all devices)</li>
                <li>🎨 Clean, modern UI with smooth animations</li>
              </ul>
            </div>

            <div className="architecture">
              <h3>🏗️ Architecture</h3>
              <div className="architecture-flow">
                <div className="arch-box">
                  <strong>Frontend (React)</strong>
                  <p>localhost:3000</p>
                </div>
                <span className="arrow">→</span>
                <div className="arch-box">
                  <strong>REST API</strong>
                  <p>JSON over HTTP</p>
                </div>
                <span className="arrow">→</span>
                <div className="arch-box">
                  <strong>Backend (Flask)</strong>
                  <p>localhost:5000</p>
                </div>
              </div>
            </div>

            <div className="github-section">
              <h3>📂 Source Code</h3>
              <p>Want to see how it's built? Check out the complete source code:</p>
              <a 
                href="https://github.com/your-username/timer-app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>

            <div className="credits">
              <p>
                <strong>Original Concept:</strong> Pygame timer application<br/>
                <strong>Web Conversion:</strong> Full-stack implementation<br/>
                <strong>Made with</strong> ❤️ <strong>for portfolio showcase</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;