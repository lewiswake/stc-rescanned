import json
import re
import urllib.request
import urllib.parse
from typing import Dict, List

# Sonic the Comic Wiki API endpoint
API_URL = "https://stc.fandom.com/api.php"
TOTAL_ISSUES = 223
BATCH_SIZE = 50  # MediaWiki API allows querying up to 50 titles per request
OUTPUT_FILE = "issues_contents.json"

def clean_item(line: str) -> str:
    """Cleans a single wikitext bullet line into human-readable text."""
    # Remove leading bullet asterisk
    text = re.sub(r"^\*\s*", "", line)
    # Remove HTML comments
    text = re.sub(r"<!--[\s\S]*?-->", "", text)
    # Replace [[Link|Display Text]] with Display Text
    text = re.sub(r"\[\[([^\|\]]+)\|([^\]]+)\]\]", r"\2", text)
    # Replace [[Link]] with Link
    text = re.sub(r"\[\[([^\]]+)\]\]", r"\1", text)
    # Remove bold/italics markers ('' or ''')
    text = re.sub(r"'''?", "", text)
    # Remove any stray HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Remove stray unclosed brackets
    text = re.sub(r"[\[\]]", "", text)
    # Decode HTML entities
    text = text.replace("&amp;", "&").replace("&quot;", '"').replace("&#039;", "'")
    return text.strip()

def extract_contents(wikitext: str) -> List[str]:
    """Extracts unordered list items from the Contents section of the wikitext."""
    # Match section header =Contents... up until the next section header (\n=) or end of string
    match = re.search(r"=+\s*Contents\s*=*\s*([\s\S]*?)(?=(?:\n=|$))", wikitext, re.IGNORECASE)
    if not match:
        return []

    section_text = match.group(1)
    items = []
    for raw_line in section_text.splitlines():
        line = raw_line.strip()
        if line.startswith("*"):
            cleaned = clean_item(line)
            if cleaned:
                items.append(cleaned)
    return items

def fetch_issues_contents() -> Dict[str, List[str]]:
    """Fetches and parses the contents of Issues 1 through 223 via Fandom API."""
    catalog = {}
    issue_numbers = list(range(1, TOTAL_ISSUES + 1))

    print(f"Fetching contents for {TOTAL_ISSUES} issues from Sonic the Comic Wiki...")

    for i in range(0, len(issue_numbers), BATCH_SIZE):
        batch = issue_numbers[i:i + BATCH_SIZE]
        titles = "|".join(f"Issue_{num}" for num in batch)

        params = {
            "action": "query",
            "prop": "revisions",
            "titles": titles,
            "rvprop": "content",
            "rvslots": "main",
            "format": "json"
        }
        url = f"{API_URL}?{urllib.parse.urlencode(params)}"

        # Custom user-agent header is good practice for MediaWiki API
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "STCRescanProject/1.0 (Comic preservation cataloguer)"}
        )

        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        pages = data.get("query", {}).get("pages", {})

        for page in pages.values():
            title = page.get("title", "")
            title_match = re.search(r"Issue\s+(\d+)", title, re.IGNORECASE)
            if not title_match:
                continue

            num = int(title_match.group(1))
            # Format key matching issues.json ("001" through "099", then "100" through "223")
            padded_key = f"{num:03d}" if num < 100 else str(num)

            revisions = page.get("revisions", [])
            content = ""
            if revisions:
                content = revisions[0].get("slots", {}).get("main", {}).get("*", "")

            items = extract_contents(content)
            catalog[num] = (padded_key, items)

        print(f"  Processed {min(i + BATCH_SIZE, TOTAL_ISSUES)} / {TOTAL_ISSUES} issues...")

    # Sort numerically by issue number and build final dictionary
    sorted_catalog = {}
    for num in sorted(catalog.keys()):
        key, items = catalog[num]
        sorted_catalog[key] = items

    return sorted_catalog

def main():
    catalog = fetch_issues_contents()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Successfully wrote {len(catalog)} issues to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
