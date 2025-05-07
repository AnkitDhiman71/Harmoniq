from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
import os
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = 'your_secret_key_here'

SONGS_DIR = 'songs'
DB_PATH = 'spotify.db'

def insert_songs_from_folder():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    for filename in os.listdir(SONGS_DIR):
        if filename.lower().endswith('.mp3'):
            title = os.path.splitext(filename)[0]
            file_path = filename
            # Check if song already exists
            c.execute("SELECT id FROM songs WHERE file_path = ?", (file_path,))
            if not c.fetchone():
                c.execute(
                    "INSERT INTO songs (title, artist, album, duration, file_path) VALUES (?, ?, ?, ?, ?)",
                    (title, "Unknown", "", 0, file_path)
                )
                print(f"Inserted: {title}")
    conn.commit()
    conn.close()
    print("Done.")

# Database initialization
def init_db():
    conn = sqlite3.connect('spotify.db')
    c = conn.cursor()
    
    # Create users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Create songs table
    c.execute('''
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT,
            duration INTEGER,
            file_path TEXT
        )
    ''')
    
    # Create playlists table
    c.execute('''
        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create playlist_songs table
    c.execute('''
        CREATE TABLE IF NOT EXISTS playlist_songs (
            playlist_id INTEGER,
            song_id INTEGER,
            FOREIGN KEY (playlist_id) REFERENCES playlists (id),
            FOREIGN KEY (song_id) REFERENCES songs (id),
            PRIMARY KEY (playlist_id, song_id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Call this function once at startup to ensure all songs are in the DB
insert_songs_from_folder()

# Database helper functions
def get_db():
    conn = sqlite3.connect('spotify.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if not username or not password or not email:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    hashed_password = generate_password_hash(password)
    
    try:
        db = get_db()
        db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                  (username, hashed_password, email))
        db.commit()
        return jsonify({'success': True, 'message': 'User created successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Username or email already exists'}), 400
    finally:
        db.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
    
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    db.close()
    
    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['username'] = username
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/songs', methods=['GET'])
def get_songs():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    query = request.args.get('query', '').strip().lower()
    db = get_db()
    if query:
        songs = db.execute('SELECT * FROM songs WHERE LOWER(title) LIKE ? OR LOWER(artist) LIKE ?', (f'%{query}%', f'%{query}%')).fetchall()
    else:
        songs = db.execute('SELECT * FROM songs').fetchall()
    db.close()
    return jsonify([dict(song) for song in songs])

@app.route('/api/songs', methods=['POST'])
def add_song():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    data = request.get_json()
    title = data.get('title')
    artist = data.get('artist')
    album = data.get('album')
    duration = data.get('duration')
    file_path = data.get('file_path')
    
    if not title or not artist:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    db = get_db()
    db.execute('''
        INSERT INTO songs (title, artist, album, duration, file_path)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, artist, album, duration, file_path))
    db.commit()
    db.close()
    
    return jsonify({'success': True, 'message': 'Song added successfully'})

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    db = get_db()
    playlists = db.execute('''
        SELECT p.*, COUNT(ps.song_id) as song_count 
        FROM playlists p 
        LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id 
        WHERE p.user_id = ? 
        GROUP BY p.id
    ''', (session['user_id'],)).fetchall()
    db.close()
    
    return jsonify([dict(playlist) for playlist in playlists])

@app.route('/')
def serve_index():
    return send_from_directory(os.path.join(os.getcwd(), 'frontend'), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    frontend_dir = os.path.join(os.getcwd(), 'frontend')
    if os.path.exists(os.path.join(frontend_dir, path)):
        return send_from_directory(frontend_dir, path)
    return 'Not Found', 404

@app.route('/songs/<path:filename>')
def serve_song(filename):
    return send_from_directory(os.path.join(os.getcwd(), 'songs'), filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')