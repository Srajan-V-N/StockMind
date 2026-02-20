#!/usr/bin/env python3
import sys
import json

try:
    import wikipedia
except ImportError:
    print(json.dumps({"error": "wikipedia module not installed. Run: pip install wikipedia"}))
    sys.exit(1)

if len(sys.argv) < 2:
    print(json.dumps({"error": "No query provided"}))
    sys.exit(1)

query = sys.argv[1]

try:
    # Search for the page
    search_results = wikipedia.search(query, results=1)

    if not search_results:
        print(json.dumps({"error": "No results found", "summary": "", "fullText": ""}))
        sys.exit(0)

    # Get the page
    page = wikipedia.page(search_results[0], auto_suggest=False)

    result = {
        "summary": page.summary,
        "fullText": page.content,
        "url": page.url,
        "title": page.title
    }

    print(json.dumps(result))

except wikipedia.exceptions.DisambiguationError as e:
    # If multiple pages match, use the first option
    try:
        page = wikipedia.page(e.options[0], auto_suggest=False)
        result = {
            "summary": page.summary,
            "fullText": page.content,
            "url": page.url,
            "title": page.title
        }
        print(json.dumps(result))
    except Exception as err:
        print(json.dumps({"error": str(err), "summary": "", "fullText": ""}))

except wikipedia.exceptions.PageError:
    print(json.dumps({"error": "Page not found", "summary": "", "fullText": ""}))

except Exception as e:
    print(json.dumps({"error": str(e), "summary": "", "fullText": ""}))
