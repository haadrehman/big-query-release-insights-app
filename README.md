# BigQuery Release Insights Hub

A beautiful, premium web dashboard that fetches the latest official BigQuery Release Notes, parses them into searchable and filterable updates, and allows you to customize and share any update directly to X (formerly Twitter) with a single click.

## Features

-   **Live RSS Sync**: Fetches release notes directly from the official Google Cloud feed: `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`
-   **Granular Update Breakdown**: Automatically parses Atom feed entries and extracts separate sub-updates (e.g. `Feature`, `Announcement`, `Breaking`, `Issue`, `Change`) so you can inspect and Tweet about them individually.
-   **Performance Caching**: Caches feed contents in-memory for 15 minutes to keep page load times fast, with a manual refresh override option.
-   **Premium Glassmorphic Design**: A gorgeous, dark-themed responsive UI with glowing radial gradients, micro-hover animations, skeleton loading cards, and custom scrollbars.
-   **Search & Type Filtering**: Real-time keyword search and type category buttons to quickly locate updates on topics like "Gemini" or "embeddings".
-   **Native Dialog Tweet Composer**: A premium, custom-styled `<dialog>` modal popup where you can edit the tweet draft, toggle quick hashtags, track character counts with a dynamic SVG progress ring, and post straight to X.
-   **Light-Dismiss Fallback**: Seamless overlay closing by clicking outside the modal box, featuring a robust JavaScript compatibility fallback.

## Tech Stack

-   **Backend**: Python Flask, `xml.etree.ElementTree` (standard XML parser), `requests`
-   **Frontend**: Plain HTML5 (semantic layout, `<dialog>`, SVG), Vanilla JavaScript (ES6+), Vanilla CSS (custom properties, flexbox/grid layout, transitions)

## Setup & Running Locally

1.  **Navigate to the project directory** (if not already there):
    ```bash
    cd bigquery_release_notes
    ```

2.  **Activate the Virtual Environment**:
    -   On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
    -   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```

3.  **Run the Flask development server**:
    ```bash
    python app.py
    ```

4.  **Open in your browser**:
    Navigate to [http://localhost:5001](http://localhost:5001) to view the application!

## File Structure

-   [app.py](file:///Users/m.haadrehman/bigquery_release_notes/app.py) - Flask server, XML parser, and in-memory cache
-   [templates/index.html](file:///Users/m.haadrehman/bigquery_release_notes/templates/index.html) - Main dashboard layout and Tweet composer dialog
-   [static/css/style.css](file:///Users/m.haadrehman/bigquery_release_notes/static/css/style.css) - Custom dark glassmorphic styling, animations, progress circle, and badges
-   [static/js/app.js](file:///Users/m.haadrehman/bigquery_release_notes/static/js/app.js) - Client logic for API calls, card rendering, filtering, and modal interaction
-   [requirements.txt](file:///Users/m.haadrehman/bigquery_release_notes/requirements.txt) - Python package dependencies
