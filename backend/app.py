from flask import Flask, jsonify, request
from flask_cors import CORS
import time
from threading import Thread, Lock
import sys

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Timer state
timer_state = {
    'current_time': 0,
    'set_time': 0,
    'is_running': False,
    'last_update': None
}
state_lock = Lock()

def timer_countdown():
    """Background thread to handle timer countdown"""
    while True:
        time.sleep(0.1)  # Check every 100ms for responsiveness
        with state_lock:
            if timer_state['is_running'] and timer_state['current_time'] > 0:
                current = time.time()
                if timer_state['last_update']:
                    elapsed = current - timer_state['last_update']
                    if elapsed >= 1.0:  # Update every second
                        timer_state['current_time'] -= 1
                        timer_state['last_update'] = current
                else:
                    timer_state['last_update'] = current

# Start background timer thread
timer_thread = Thread(target=timer_countdown, daemon=True)
timer_thread.start()

@app.route('/api/timer/status', methods=['GET'])
def get_status():
    """Get current timer status"""
    with state_lock:
        minutes = int(timer_state['current_time'] / 60) % 60
        seconds = timer_state['current_time'] % 60
        return jsonify({
            'current_time': timer_state['current_time'],
            'set_time': timer_state['set_time'],
            'is_running': timer_state['is_running'],
            'display_time': f"{minutes:02}:{seconds:02}"
        })

@app.route('/api/timer/start', methods=['POST'])
def start_timer():
    """Start timer with specified time"""
    data = request.get_json()
    minutes = data.get('minutes', 0)
    seconds = data.get('seconds', 0)
    
    total_seconds = minutes * 60 + seconds
    
    with state_lock:
        timer_state['set_time'] = total_seconds
        timer_state['current_time'] = total_seconds
        timer_state['is_running'] = True
        timer_state['last_update'] = time.time()
    
    return jsonify({'status': 'started', 'time': total_seconds})

@app.route('/api/timer/stop', methods=['POST'])
def stop_timer():
    """Stop timer and reset to 0"""
    with state_lock:
        timer_state['current_time'] = 0
        timer_state['is_running'] = False
        timer_state['last_update'] = None
    
    return jsonify({'status': 'stopped'})

@app.route('/api/timer/pause', methods=['POST'])
def pause_timer():
    """Pause/Resume timer"""
    with state_lock:
        timer_state['is_running'] = not timer_state['is_running']
        if timer_state['is_running']:
            timer_state['last_update'] = time.time()
        else:
            timer_state['last_update'] = None
        
        return jsonify({
            'status': 'resumed' if timer_state['is_running'] else 'paused',
            'is_running': timer_state['is_running']
        })

@app.route('/api/timer/reset', methods=['POST'])
def reset_timer():
    """Reset timer to set time"""
    with state_lock:
        timer_state['current_time'] = timer_state['set_time']
        timer_state['is_running'] = False
        timer_state['last_update'] = None
    
    return jsonify({'status': 'reset', 'time': timer_state['set_time']})

if __name__ == '__main__':
    print("Starting Timer Backend Server...")
    print("Server running on http://localhost:5000")
    app.run(debug=True, port=5000, threaded=True)