# Gemini AI Chrome Extension

A lightweight Chrome extension that integrates Google's Gemini AI for text processing and content generation directly in your browser.

## Features

-   AI-powered text enhancement and analysis
-   Context menu integration for selected text
-   Real-time processing with loading indicators
-   Markdown rendering support
-   Cross-site compatibility

## Installation

1. Clone the repository:

    ->bash
    git clone https://github.com/yourusername/gemini-extension.git
    cd gemini-extension

2. Get your API key from [Google AI Studio](https://aistudio.google.com/)

3. Load the extension in Chrome:

    - Go to `chrome://extensions/`
    - Enable Developer mode
    - Click "Load unpacked" and select the project folder

4. Configure your API key:

    - Click the extension icon and open Options
    - Paste your API key and save

## Project Structure

gemini-extension/

├── manifest.json # Extension configuration

├── popup.html # Popup UI

├── popup.js # Popup logic

├── content.js # Content script

├── options.html # Settings page

├── options.js # Settings logic

├── styles.css # Styles

└── icons/ # Extension icons

└── icon128.png
