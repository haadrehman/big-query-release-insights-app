import os
import re
import time
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
import requests

app = Flask(__name__)

# Cache for releases: caches parsed release notes to prevent hitting BQ feeds constantly
CACHE_DURATION_SECONDS = 900  # 15 minutes cache
releases_cache = {
    "data": None,
    "last_fetched": 0
}

def strip_html_tags(html):
    """
    Converts HTML release note content into formatted plain text
    suitable for Twitter / X drafts.
    """
    text = html
    # Replace list items with bullet points
    text = re.sub(r'<li>', '- ', text)
    text = re.sub(r'</li>', '\n', text)
    # Remove paragraphs but preserve spacing
    text = re.sub(r'<p>', '', text)
    text = re.sub(r'</p>', '\n\n', text)
    # Put backticks around inline code
    text = re.sub(r'<code>', '`', text)
    text = re.sub(r'</code>', '`', text)
    # Strip all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode common HTML entities
    text = (text.replace('&nbsp;', ' ')
                .replace('&lt;', '<')
                .replace('&gt;', '>')
                .replace('&amp;', '&')
                .replace('&quot;', '"')
                .replace('&apos;', "'")
                .replace('&#39;', "'"))
    # Collapse multiple blank lines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def fetch_and_parse_feed(force=False):
    """
    Fetches the BigQuery XML feed, parses the ATOM structure,
    splits multi-topic entries into individual sub-updates by <h3> tag,
    and returns a list of formatted release items.
    """
    now = time.time()
    if not force and releases_cache["data"] and (now - releases_cache["last_fetched"]) < CACHE_DURATION_SECONDS:
        return releases_cache["data"]

    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    xml_data = response.text

    # Parse ATOM XML
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    root = ET.fromstring(xml_data)
    
    entries = []
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        date_str = title.text.strip() if title is not None else "Unknown Date"
        
        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text.strip() if id_elem is not None else str(time.time())
        
        updated_elem = entry.find('atom:updated', ns)
        iso_date = updated_elem.text.strip() if updated_elem is not None else ""
        
        # Link
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        if link_elem is None:
            link_elem = entry.find('atom:link', ns)
        link = link_elem.attrib.get('href', '') if link_elem is not None else ''
        
        # HTML Content
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ''
        
        # Split by h3 header tag to find sub-updates (e.g. Feature, Issue, Announcement, Change)
        sub_updates = re.findall(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', content_html, re.DOTALL)
        
        if not sub_updates:
            clean_text = strip_html_tags(content_html)
            entries.append({
                "id": entry_id,
                "date": date_str,
                "iso_date": iso_date,
                "type": "General",
                "content_html": content_html,
                "content_text": clean_text,
                "link": link
            })
        else:
            for idx, (update_type, update_content) in enumerate(sub_updates):
                utype = update_type.strip()
                ucontent = update_content.strip()
                clean_text = strip_html_tags(ucontent)
                entries.append({
                    "id": f"{entry_id}_{idx}",
                    "date": date_str,
                    "iso_date": iso_date,
                    "type": utype,
                    "content_html": ucontent,
                    "content_text": clean_text,
                    "link": link
                })
                
    releases_cache["data"] = entries
    releases_cache["last_fetched"] = now
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    try:
        data = fetch_and_parse_feed(force=force_refresh)
        return jsonify({
            "status": "success",
            "count": len(data),
            "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(releases_cache["last_fetched"])),
            "releases": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Default to 5001 or standard Flask development port
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
