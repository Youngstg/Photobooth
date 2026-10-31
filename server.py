import os
import json
import base64
import numpy as np
import cv2
import uuid
import datetime
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.after_request
def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# ----------------- FIREBASE SETUP -----------------
FIREBASE_CREDENTIALS_JSON = os.environ.get('FIREBASE_CREDENTIALS')
firebase_initialized = False
db = None

if FIREBASE_CREDENTIALS_JSON:
    try:
        cred_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
        
        # Initialize without Storage Bucket
        firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        firebase_initialized = True
        print("[OK] Firebase Firestore initialized successfully!")
    except Exception as e:
        print(f"[ERROR] Error initializing Firebase: {e}")
else:
    print("[INFO] FIREBASE_CREDENTIALS not set. Falling back to LOCAL storage.")
# --------------------------------------------------

TEMPLATES_FILE = 'templates.json'

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/filter', methods=['POST'])
def apply_filter():
    try:
        data = request.json
        image_data = data.get('image')
        filter_type = data.get('filter')

        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        if ',' in image_data:
            image_data = image_data.split(',')[1]

        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'error': 'Failed to decode image'}), 400

        processed_img = img
        if filter_type == 'grayscale':
            processed_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            processed_img = cv2.cvtColor(processed_img, cv2.COLOR_GRAY2BGR)
            
        elif filter_type == 'sepia':
            sepia_filter = np.array([[0.272, 0.534, 0.131],
                                     [0.349, 0.686, 0.168],
                                     [0.393, 0.769, 0.189]])
            processed_img = cv2.transform(img, sepia_filter)
            processed_img = np.clip(processed_img, 0, 255).astype(np.uint8)
            
        elif filter_type == 'retro':
            processed_img = cv2.convertScaleAbs(img, alpha=1.2, beta=20)
            b, g, r = cv2.split(processed_img)
            b = cv2.convertScaleAbs(b, alpha=0.8, beta=-10)
            g = cv2.convertScaleAbs(g, alpha=1.05, beta=10)
            processed_img = cv2.merge((b, g, r))
            
        elif filter_type == 'frog':
            h, w = img.shape[:2]
            center_x, center_y = w / 2, h / 2
            radius = min(w, h) * 0.4
            x, y = np.meshgrid(np.arange(w), np.arange(h))
            dx = x - center_x
            dy = y - center_y
            distance = np.sqrt(dx**2 + dy**2)
            r = distance / radius
            r[r == 0] = 1
            mask = distance < radius
            new_x = x.copy().astype(np.float32)
            new_y = y.copy().astype(np.float32)
            new_r = r**0.5
            new_x[mask] = (center_x + (dx[mask] / r[mask]) * new_r[mask]).astype(np.float32)
            new_y[mask] = (center_y + (dy[mask] / r[mask]) * new_r[mask]).astype(np.float32)
            processed_img = cv2.remap(img, new_x, new_y, interpolation=cv2.INTER_LINEAR)
            
            b, g, r_ch = cv2.split(processed_img)
            g = cv2.convertScaleAbs(g, alpha=1.0, beta=30)
            processed_img = cv2.merge((b, g, r_ch))

        _, buffer = cv2.imencode('.jpg', processed_img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        b64_str = base64.b64encode(buffer).decode('utf-8')
        result_data_url = f"data:image/jpeg;base64,{b64_str}"

        return jsonify({'image': result_data_url})

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

def overlay_transparent(background, overlay, x, y, overlay_size=None):
    if overlay_size is not None:
        overlay = cv2.resize(overlay, overlay_size, interpolation=cv2.INTER_AREA)
    bg_h, bg_w = background.shape[:2]
    ol_h, ol_w = overlay.shape[:2]
    if x >= bg_w or y >= bg_h or x + ol_w <= 0 or y + ol_h <= 0:
        return background
    x1, y1 = max(x, 0), max(y, 0)
    x2, y2 = min(x + ol_w, bg_w), min(y + ol_h, bg_h)
    ox1, oy1 = x1 - x, y1 - y
    ox2, oy2 = ox1 + (x2 - x1), oy1 + (y2 - y1)
    
    alpha = overlay[oy1:oy2, ox1:ox2, 3] / 255.0
    alpha = np.expand_dims(alpha, axis=2)
    bg_roi = background[y1:y2, x1:x2]
    ol_rgb = overlay[oy1:oy2, ox1:ox2, :3]
    blended = (ol_rgb * alpha + bg_roi * (1.0 - alpha)).astype(np.uint8)
    background[y1:y2, x1:x2] = blended
    return background

@app.route('/api/apply-props', methods=['POST'])
def apply_props():
    try:
        data = request.json or {}
        image_data = data.get('image')
        prop_type = data.get('prop', 'cowboy')

        if not image_data:
            return jsonify({'error': 'No image provided'}), 400

        if ',' in image_data:
            image_data = image_data.split(',')[1]

        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'error': 'Failed to decode image'}), 400

        # Load cascade classifier
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

        # Prop assets path
        props_dir = os.path.join(os.path.dirname(__file__), 'Assets', 'props')

        def load_prop_img(name):
            webp = os.path.join(props_dir, f"{name}.webp")
            if os.path.exists(webp):
                return cv2.imread(webp, cv2.IMREAD_UNCHANGED)
            png = os.path.join(props_dir, f"{name}.png")
            if os.path.exists(png):
                return cv2.imread(png, cv2.IMREAD_UNCHANGED)
            return None

        for (x, y, w, h) in faces:
            if prop_type in ['cowboy', 'cowboy_mustache']:
                hat_img = load_prop_img('cowboy_hat')
                if hat_img is not None:
                    target_w = int(w * 1.7)
                    target_h = int(target_w * (400 / 600))
                    ox = x - int((target_w - w) / 2)
                    oy = y - int(target_h * 0.65)
                    img = overlay_transparent(img, hat_img, ox, oy, (target_w, target_h))

            if prop_type in ['mustache', 'cowboy_mustache', 'party']:
                mus_img = load_prop_img('mustache')
                if mus_img is not None:
                    target_w = int(w * 0.65)
                    target_h = int(target_w * (200 / 400))
                    ox = x + int(w * 0.175)
                    oy = y + int(h * 0.65)
                    img = overlay_transparent(img, mus_img, ox, oy, (target_w, target_h))

            if prop_type in ['glasses', 'party']:
                gla_img = load_prop_img('sunglasses')
                if gla_img is not None:
                    target_w = int(w * 1.02)
                    target_h = int(target_w * (200 / 500))
                    ox = x - int((target_w - w) / 2)
                    oy = y + int(h * 0.22)
                    img = overlay_transparent(img, gla_img, ox, oy, (target_w, target_h))

            if prop_type in ['crown', 'party']:
                crw_img = load_prop_img('crown')
                if crw_img is not None:
                    target_w = int(w * 1.1)
                    target_h = int(target_w * (300 / 400))
                    ox = x - int((target_w - w) / 2)
                    oy = y - int(target_h * 0.70)
                    img = overlay_transparent(img, crw_img, ox, oy, (target_w, target_h))

            if prop_type == 'cat':
                cat_img = load_prop_img('cat_ears')
                if cat_img is not None:
                    target_w = int(w * 1.2)
                    target_h = int(target_w * (250 / 400))
                    ox = x - int((target_w - w) / 2)
                    oy = y - int(target_h * 0.65)
                    img = overlay_transparent(img, cat_img, ox, oy, (target_w, target_h))

        _, buffer = cv2.imencode('.jpg', img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        b64_str = base64.b64encode(buffer).decode('utf-8')
        result_data_url = f"data:image/jpeg;base64,{b64_str}"

        return jsonify({'image': result_data_url, 'faces_detected': len(faces)})

    except Exception as e:
        print(f"Error applying props: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/upload-template', methods=['POST'])
def upload_template():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and file.filename.endswith('.png'):
        # Membaca isi gambar
        file_bytes = file.read()
        
        # Mengecek ukuran file (Firestore max 1MB per document, kita batasi 700KB untuk aman)
        if len(file_bytes) > 700 * 1024:
            return jsonify({'error': 'Ukuran gambar terlalu besar! Maksimal 700KB.'}), 400
            
        if firebase_initialized:
            # Mengubah gambar menjadi teks Base64 untuk disimpan langsung ke Firestore Database nantinya
            b64_str = base64.b64encode(file_bytes).decode('utf-8')
            return jsonify({'url': f"data:image/png;base64,{b64_str}"})
        else:
            # Fallback ke penyimpanan lokal jika tidak pakai Firebase
            file.seek(0)
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            return jsonify({'url': f'/uploads/{filename}'})
            
    return jsonify({'error': 'Format salah, harus berupa gambar PNG.'}), 400

@app.route('/api/templates', methods=['GET'])
def get_templates():
    if firebase_initialized:
        try:
            docs = db.collection('templates').stream()
            templates = [doc.to_dict() for doc in docs]
            return jsonify(templates)
        except Exception as e:
            print(f"Firebase Read Error: {e}")
            return jsonify([])
    else:
        if not os.path.exists(TEMPLATES_FILE):
            return jsonify([])
        with open(TEMPLATES_FILE, 'r') as f:
            return jsonify(json.load(f))

@app.route('/api/admin/save-config', methods=['POST'])
def save_config():
    data = request.json
    template_id = data.get('id')
    
    if not template_id:
         return jsonify({'error': 'Missing template ID'}), 400
         
    if firebase_initialized:
        try:
            db.collection('templates').document(template_id).set(data)
            return jsonify({'success': True})
        except Exception as e:
            print(f"Firebase Write Error: {e}")
            return jsonify({'error': str(e)}), 500
    else:
        templates = []
        if os.path.exists(TEMPLATES_FILE):
            with open(TEMPLATES_FILE, 'r') as f:
                templates = json.load(f)
        
        existing = next((t for t in templates if t['id'] == template_id), None)
        if existing:
            existing.update(data)
        else:
            templates.append(data)
            
        with open(TEMPLATES_FILE, 'w') as f:
            json.dump(templates, f, indent=4)
        return jsonify({'success': True})

@app.route('/api/admin/delete-template', methods=['POST'])
def delete_template():
    data = request.json or {}
    template_id = data.get('id')
    if not template_id:
        return jsonify({'error': 'Missing template ID'}), 400
    
    if firebase_initialized:
        try:
            db.collection('templates').document(template_id).delete()
            return jsonify({'success': True, 'message': f'Template {template_id} berhasil dihapus'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        if not os.path.exists(TEMPLATES_FILE):
            return jsonify({'error': 'Templates file not found'}), 404
        with open(TEMPLATES_FILE, 'r') as f:
            templates = json.load(f)
        
        initial_len = len(templates)
        templates = [t for t in templates if t.get('id') != template_id]
        if len(templates) == initial_len:
            return jsonify({'error': 'Template not found'}), 404
            
        with open(TEMPLATES_FILE, 'w') as f:
            json.dump(templates, f, indent=4)
        return jsonify({'success': True, 'message': f'Template {template_id} berhasil dihapus'})

if __name__ == '__main__':
    print("============================================")
    print("  PHOTOBOOTH SERVER (FLASK + OPENCV)")
    print("============================================")
    print("Starting server...")
    
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
