# Adrishya - Step-by-Step Setup & Installation Guide (`setup_guide.md`)

This guide is designed for absolute beginners ("newbies") to help you clone, configure, run, and compile **Adrishya** from scratch on **Windows**, **macOS**, and **Linux (Ubuntu)**.

---

## 1. Prerequisites (Must Install First)

Before you begin, make sure your computer has the following tools installed:

1. **Git**: Used to download the code from GitHub.
   - [Download Git here](https://git-scm.com/downloads) (Select your OS and install with default settings).
2. **Node.js (v20 or higher)**: The JavaScript runtime required to run and build the application.
   - [Download Node.js here](https://nodejs.org/) (Choose the **LTS (Long Term Support)** version).
   - Installing Node.js also automatically installs **npm** (Node Package Manager).

---

## 2. Step-by-Step Installation

Open your terminal or command prompt and run the following commands sequentially.

### Step 1: Clone the Code
Download a copy of the repository code to your computer:
```bash
git clone https://github.com/IamJayPrakash/adrishya.git
```

### Step 2: Navigate into the Project Folder
Move your terminal directory inside the newly downloaded code folder:
```bash
cd adrishya
```

### Step 3: Install Dependencies
Download all the package libraries (React, Tailwind CSS, Electron, Tesseract OCR) required by the app:
```bash
npm install
```

---

## 3. Platform-Specific Setup & How to Run

### 🖥️ Windows (Windows 10 / 11)

#### Run in Development Mode:
To launch the app on your desktop immediately to test/debug it:
```powershell
npm run dev
```

#### Build the Desktop Installer (`.exe`):
To package the app into a standalone installer that you can share or install onto your C: drive:
```powershell
npm run build:win
```
- Once compilation is complete, find your installer executable in: `dist/adrishya-1.0.0-setup.exe`.
- Double-click to install it like any standard Windows software.

---

### 🍏 macOS (Intel & Apple Silicon)

#### Run in Development Mode:
```bash
npm run dev
```

#### Build the macOS Installer (`.dmg`):
```bash
npm run build:mac
```
- Once compiled, find the disk image in: `dist/adrishya-1.0.0.dmg`.
- Double-click the `.dmg` and drag the **Adrishya** app into your Applications folder.
- *Note: On launch, macOS may ask for Screen Recording and Microphone permissions. You must grant them in System Settings for OCR and voice transcription to function.*

---

### 🐧 Linux (Ubuntu / Debian / RedHat)

#### Step 1: Install System Prerequisites
Electron uses native desktop screen-capturing APIs that require development packages. Run the following in your Ubuntu terminal:
```bash
sudo apt update
sudo apt install build-essential libxss-dev libx11-dev libxtst-dev
```

#### Step 2: Run in Development Mode:
```bash
npm run dev
```

#### Step 3: Build the Linux Package (AppImage / deb):
```bash
npm run build:linux
```
- Once compiled, find the package inside the `dist/` directory.

---

## 4. Configuring API Credentials

You can supply your AI API Keys (Gemini, OpenAI, Claude, Groq, or Grok) in two ways:

### Method A: Through the Application UI (Recommended)
1. Launch the app.
2. Click the **Settings** (Gear) icon in the bottom navigation bar.
3. Choose your active provider and enter your API keys.
4. Click **Save Settings**. (Stored securely in your local folder).

### Method B: Through a `.env` File (For Developers)
1. In the root directory of the project, make a copy of the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in any text editor and fill in your API key values:
   ```env
   VITE_GEMINI_API_KEY=your_actual_key_here
   VITE_OPENAI_API_KEY=your_actual_key_here
   ```
3. When you run `npm run dev`, the app will automatically load these environment keys as fallbacks.

---

## 5. How to Use the Desktop Overlay

1. **Visibility**: Press **`Ctrl+Shift+A`** on your keyboard from *any* active window (like Google Meet in Chrome) to instantly hide or show the overlay widget.
2. **Dragging**: Click and hold the top header bar of the overlay (where the logo and title "Adrishya" are displayed) to drag and place the widget anywhere on your screen.
3. **Collapsing**: Click the Minimize/Expand button on the top right to collapse the app into a tiny pill widget, keeping your desktop clean during meetings.
4. **Voice Assistant**: Press **`Ctrl+Shift+V`** system-wide to start recording your voice. Once you stop speaking, the transcription will automatically feed into the chat.
5. **Screen OCR**: Click the Screen (Target) icon, then click **Capture Screen & OCR** to analyze text from your screen (e.g. explain code snippets during a meeting).
