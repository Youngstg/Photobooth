# 📸 Cute Snaps Photobooth

A dynamic, web-based Photobooth application featuring Face AR Filters, real-time image processing, custom templates, and dual themes (Retro & Y2K). Built with Python (Flask), OpenCV, MediaPipe, and Firebase.

## ✨ Features

- **Dual Themes**: Toggle between a nostalgic 90s Retro style and a vibrant Y2K aesthetic with a single click.
- **AR Face Filters**: Real-time face tracking using Google's MediaPipe. Try on virtual crowns, emojis, and stickers that follow your face!
- **Real-time Image Processing**: Backend powered by OpenCV for high-quality filters including Grayscale, Sepia, Retro color grading, and a funny "Frog" bulge effect.
- **Custom Templates**: Take 4 consecutive photos with a countdown timer, which are automatically stitched into beautiful polaroid-style frames.
- **Admin Panel**: A dedicated `/admin.html` page to upload and manage custom frames dynamically.
- **Serverless & Cloud Ready**: Images and templates are Base64 encoded and stored in Firebase Firestore, allowing seamless deployment on serverless platforms like Vercel without data loss.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS, JavaScript
- **Computer Vision (Client)**: MediaPipe Face Landmarks
- **Backend API**: Python 3, Flask, Werkzeug
- **Image Processing (Server)**: OpenCV (`opencv-python-headless`), NumPy
- **Database**: Firebase Firestore (NoSQL)
- **Deployment**: Vercel (Serverless Functions)

## 🚀 How to Run Locally

### Prerequisites
- Python 3.8+
- pip

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Youngstg/Photobooth.git
   cd Photobooth
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. *(Optional)* Set up Firebase Credentials if you want to test the Admin Panel with Cloud Database:
   - Create an environment variable `FIREBASE_CREDENTIALS` containing your Service Account JSON.
   - *If not set, the app will gracefully fallback to local storage (`templates.json` and `uploads/`).*

4. Run the server:
   ```bash
   python server.py
   ```
5. Open your browser and navigate to `http://localhost:8000`.

## 🌍 Deployment on Vercel

This app is heavily optimized for Vercel deployment.
1. Import this repository to Vercel.
2. In the Vercel Dashboard, go to **Settings > Environment Variables**.
3. Add `FIREBASE_CREDENTIALS` and paste your Firebase Service Account JSON as the value.
4. Deploy! Vercel will automatically use `vercel.json` to route `/api/*` to the Python Flask backend while serving the static HTML/CSS/JS frontend on its global Edge Network.

---
*Created with ❤️ for capturing the best moments!*
