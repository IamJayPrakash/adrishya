# Adrishya - Test Case Specification (`test_case.md`)

This document outlines the complete testing specification for **Adrishya**. Given that Adrishya blends OS-level integrations (frameless transparent windows, screen capture, global hotkeys, content protection, and native vibrancy) with a React web client, testing is split into **Automated Tests** (executed via Vitest) and **Manual E2E Verification Test Cases**.

---

## 1. Automated Test Suites (Vitest)

Adrishya has **13 automated tests** configured in the `src/main/__tests__/` and `src/renderer/src/__tests__/` folders. These tests verify the isolated logic, API request formats, IPC communications, state changes, and component renders.

### A. Main Process & OS Bridge (`mainProcess.test.ts`)

| ID | Test Case | Target / Focus | Verification |
|:---|:---|:---|:---|
| **AUT-01** | `registers call-ai-api IPC handler` | Main Process IPC | Verifies the handler is initialized to intercept AI completion requests. |
| **AUT-02** | `registers transcribe-audio IPC handler` | Main Process IPC | Verifies the handler is initialized to intercept speech recording buffers. |
| **AUT-03** | `submits correctly formatted requests to OpenAI API` | API Service Client | Mocks `fetch` to verify proper endpoints, request headers, models (`gpt-4o-mini`), and authorization token format. |
| **AUT-04** | `submits correctly formatted requests to Gemini API` | API Service Client | Mocks `fetch` to verify proper URL construction (`models/gemini-1.5-flash:generateContent?key=...`) and conversion from role-based messages to Google's format. |
| **AUT-05** | `verifies BrowserWindow can setContentProtection to enable screen invisibility` | OS Window Protection | Verifies the main window calls native OS bindings to enable content protection. |
| **AUT-06** | `verifies that setContentProtection is activated on startup` | Startup Security | Confirms that the main window is locked for screenshot/video protection immediately upon creation. |
| **AUT-07** | `handles resize-window events by updating BrowserWindow bounds` | Window Control | Simulates an IPC message from the overlay and confirms the window size is updated. |
| **AUT-08** | `handles window-move events and drags the window accordingly` | Custom Dragging | Simulates an IPC drag event with delta coords and verifies the position changes relative to the current bounds. |
| **AUT-09** | `handles capture-screen-ocr events by taking screenshot and running local OCR` | OCR Engine | Triggers screen capture, parses thumbnail buffer, executes mocked local Tesseract engine, and checks returned transcript text. |

### B. React Components & UI State (`SettingsPanel.test.tsx`, `ChatPanel.test.tsx`)

| ID | Test Case | Target / Focus | Verification |
|:---|:---|:---|:---|
| **AUT-10** | `renders SettingsPanel with correct options and sliders` | `SettingsPanel.tsx` | Renders settings controls (opacity, font size, themes, provider selections, API keys inputs) and confirms it triggers callbacks on changes and saves. |
| **AUT-11** | `renders empty message list with default state` | `ChatPanel.tsx` | Verifies the chat is clean initially and displays instructions when there are no messages. |
| **AUT-12** | `renders message list history correctly` | `ChatPanel.tsx` | Confirms user prompts and assistant completions render properly as distinct conversation bubbles. |
| **AUT-13** | `calls onSendMessage and clears input on send` | `ChatPanel.tsx` | Enters a custom prompt text, clicks "Send", asserts that the callback is executed with prompt text, and checks that input is cleared. |

---

## 2. Manual Verification Test Cases (E2E)

Since some hardware/OS integrations (like native screen invisibility, microphone drivers, and system-wide hotkeys) cannot be fully asserted in JSDOM or unit tests, follow these steps to verify them manually.

### E2E-01: Frameless Overlay Glassmorphism & Themes
- **Objective**: Ensure the overlay renders without window borders, has rounded corners, and applies frosted glass styles.
- **Steps**:
  1. Launch the app in dev mode using `npm run dev`.
  2. Confirm the window lacks default OS title bars or frames.
  3. Verify a translucent frosted glass background exists.
  4. Navigate to Settings and toggle themes between **Light**, **Dark**, and **AMOLED Black**.
- **Expected Result**: Light/Dark apply high-contrast translucent colors. AMOLED applies a solid dark theme.

### E2E-02: Frameless Dragging and Collapsing
- **Objective**: Verify the window can be repositioned and collapsed to avoid screen clutter.
- **Steps**:
  1. Click and hold the header area of the widget and drag the mouse.
  2. Click the collapse button (up-chevron / minus icon) on the top right.
  3. Verify the layout transforms into a compact pill.
  4. Click the expand button to return to the full dashboard.
- **Expected Result**: Dragging repositions the overlay smoothly. Collapsing resizes the window to a small widget.

### E2E-03: Screen-Sharing Invisibility (Content Protection)
- **Objective**: Confirm the overlay remains 100% invisible on screen recordings and screen-shares.
- **Steps**:
  1. Open a screen-sharing tool (Discord, Zoom, MS Teams) or open a local screen recording software (OBS Studio).
  2. Set the screen share/recording to capture the entire desktop.
  3. Position the Adrishya widget on top of a text file or browser.
  4. Look at the screen share preview or the final recording.
- **Expected Result**: To the person sharing the screen, the widget is fully visible. To the audience (or on the final recording), the widget's area appears as a **completely black box** or is **entirely omitted**, protecting privacy.

### E2E-04: Global Shortcut Controls
- **Objective**: Verify visibility and voice assistant recording can be toggled using system hotkeys.
- **Steps**:
  1. Focus another application (e.g., Notepad, VS Code) in full screen.
  2. Press `Ctrl+Shift+A` on your keyboard.
  3. Press `Ctrl+Shift+A` again.
  4. Press `Ctrl+Shift+V` to trigger recording.
- **Expected Result**:
  - `Ctrl+Shift+A` toggles visibility (hides/shows the overlay instantly).
  - `Ctrl+Shift+V` starts voice recording (a pulsing wave appears in the overlay widget).

### E2E-05: Local Speech-to-Text (Continuous)
- **Objective**: Verify speech input operates locally using offline Chromium Speech APIs.
- **Steps**:
  1. Click the microphone icon or press `Ctrl+Shift+V` to open Voice Input.
  2. Select "Local Engine" in the settings panel.
  3. Speak a test sentence (e.g. *"Show me the code for a sorting algorithm"*).
- **Expected Result**: Transcript updates in near real-time. Once you stop speaking, the prompt is automatically sent to the chat panel.

### E2E-06: Cloud Whisper Transcription
- **Objective**: Verify speech input functions via Whisper APIs (Groq or OpenAI).
- **Steps**:
  1. Add your Groq API Key or OpenAI API Key in Settings.
  2. Set the transcription mode to "Whisper API" and select your provider.
  3. Click "Start Voice" and speak into your mic.
- **Expected Result**: The app records audio, sends the chunk to the main process, transcribes it via Whisper, and appends the transcript to the panel.

### E2E-07: Desktop Screen Capture & Local OCR
- **Objective**: Confirm the app can read code and text from your active screen locally.
- **Steps**:
  1. Open a browser window with some code visible (e.g., LeetCode, HackerRank).
  2. Click the Screen icon (Target icon) in the Adrishya overlay.
  3. Click "Capture Screen & OCR".
  4. Once text is extracted, click "Explain Code" or "Solve / Answer".
- **Expected Result**:
  - Captured text matches the screen content.
  - Tesseract runs local analysis in the background.
  - The AI provider responds to the prompt using the OCR context.

### E2E-08: Persistent Configuration
- **Objective**: Verify keys, themes, and models are stored securely across sessions.
- **Steps**:
  1. Open settings, input mock keys for all providers, set opacity to `75%`, theme to `AMOLED`.
  2. Click "Save Settings".
  3. Close the application.
  4. Re-open the application.
- **Expected Result**: Custom keys, selected models, and theme styles are loaded automatically from local storage.

---

## 3. How to Run the Test Suite

Execute the following commands in the workspace root to run tests:

```bash
# 1. Run all unit and integration tests (single run)
npm run test

# 2. Run tests in watch/development mode
npx vitest

# 3. Check code compilation & types
npm run build
```
