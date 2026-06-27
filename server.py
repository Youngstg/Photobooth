import os
import base64
import numpy as np
import cv2
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

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

        # Remove "data:image/jpeg;base64," prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        # Decode base64 to OpenCV image
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'error': 'Failed to decode image'}), 400

        # Apply filter
        processed_img = img
        if filter_type == 'grayscale':
            processed_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            processed_img = cv2.cvtColor(processed_img, cv2.COLOR_GRAY2BGR) # Keep 3 channels
            
        elif filter_type == 'sepia':
            # Sepia matrix for BGR
            sepia_filter = np.array([[0.272, 0.534, 0.131],
                                     [0.349, 0.686, 0.168],
                                     [0.393, 0.769, 0.189]])
            processed_img = cv2.transform(img, sepia_filter)
            processed_img = np.clip(processed_img, 0, 255).astype(np.uint8)
            
        elif filter_type == 'retro':
            # Increase contrast, reduce blue, increase red/green
            processed_img = cv2.convertScaleAbs(img, alpha=1.2, beta=20)
            b, g, r = cv2.split(processed_img)
            b = cv2.convertScaleAbs(b, alpha=0.8, beta=-10)
            g = cv2.convertScaleAbs(g, alpha=1.05, beta=10)
            processed_img = cv2.merge((b, g, r))
            
        elif filter_type == 'frog':
            # Frog Face (Bulge effect) using remap
            h, w = img.shape[:2]
            center_x, center_y = w / 2, h / 2
            radius = min(w, h) * 0.4
            
            # Create meshgrid
            x, y = np.meshgrid(np.arange(w), np.arange(h))
            
            dx = x - center_x
            dy = y - center_y
            distance = np.sqrt(dx**2 + dy**2)
            
            # Normalize distance and apply bulge power (0.5)
            r = distance / radius
            r[r == 0] = 1 # prevent division by zero
            
            mask = distance < radius
            
            new_x = x.copy().astype(np.float32)
            new_y = y.copy().astype(np.float32)
            
            new_r = r**0.5
            
            new_x[mask] = (center_x + (dx[mask] / r[mask]) * new_r[mask]).astype(np.float32)
            new_y[mask] = (center_y + (dy[mask] / r[mask]) * new_r[mask]).astype(np.float32)
            
            processed_img = cv2.remap(img, new_x, new_y, interpolation=cv2.INTER_LINEAR)
            
            # Add slight green tint for frog
            b, g, r_ch = cv2.split(processed_img)
            g = cv2.convertScaleAbs(g, alpha=1.0, beta=30)
            processed_img = cv2.merge((b, g, r_ch))

        # Encode back to base64
        _, buffer = cv2.imencode('.jpg', processed_img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        b64_str = base64.b64encode(buffer).decode('utf-8')
        result_data_url = f"data:image/jpeg;base64,{b64_str}"

        return jsonify({'image': result_data_url})

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("============================================")
    print("  PHOTOBOOTH SERVER (FLASK + OPENCV)")
    print("============================================")
    print("Starting server on http://localhost:8000")
    print("Press Ctrl+C to stop the server")
    print("============================================")
    
    # Get port from environment variable for deployment (e.g., Render, Railway)
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
