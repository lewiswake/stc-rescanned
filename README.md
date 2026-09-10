# Sonic the Comic Rescan Project

Welcome to the **Sonic the Comic Rescan Project** repository! This project serves as a comprehensive web archive dedicated to preserving high-quality, complete 600 DPI scans of Fleetway Editions' legendary *Sonic the Comic* series. 

Visit the live site: [stcscans.zone](https://stcscans.zone/)

## Overview

The goal of this project is to provide fans and comic archivists with the highest quality digital preservation of every issue and special release of *Sonic the Comic*. All issues have been rescanned and carefully optimized.

The website provides an easy-to-use interface to:
- Browse the entire library of mainline issues and specials.
- Filter issues by publication year.
- Search for specific issues by number or title.
- Download standard definition (SD), high definition (HD), and raw 600 DPI master `.cbz` files directly from the Internet Archive.

## Project Structure

The project is built as a static website using vanilla HTML, CSS, and JavaScript.

- `index.html`: The main homepage and user interface.
- `style.css`: The styling and responsive layout for the archive grid and UI components.
- `script.js`: Handles data fetching, filtering, sorting, pagination, and dynamic rendering of the comic grids.
- `issues.json`: The central database of all available scans. Each entry contains the issue number, publication date, cover image path, and links to the archive files.
- `/images`: Contains the cover thumbnails for each issue, as well as site icons and logos.

## How to Contribute or Update the Archive

The archive is driven by the `issues.json` file. If a new issue has been scanned and uploaded to the Internet Archive, you can add it to the site by updating the JSON file.

### Adding a New Issue

Add a new object to the array in `issues.json` following this structure:

```json
{
  "id": 160,
  "high": "STC_160_HighRes.cbz",
  "standard": "STC_160_StandardRes.cbz",
  "image": "images/160.jpg",
  "master": "https://archive.org/details/sonicTheComic160",
  "date": "1999-07-04"
}
```

For **Specials**, the format includes `type` and `title`:

```json
{
  "id": "summer-1994", 
  "type": "special",
  "title": "Sonic the Summer Special 1994",
  "high": "STC_Summer_1994_HighRes.cbz", 
  "standard": "STC_Summer_1994_StandardRes.cbz", 
  "image": "images/STC_Summer_1994.jpg", 
  "master": "https://archive.org/details/sonic-the-summer-special-1994",
  "date": "1994-06-18"
}
```

Make sure to add the corresponding cover image to the `/images` folder.

## Running Locally

Because the site fetches data asynchronously from `issues.json`, it must be served over a local web server (opening the file directly via `file://` will result in CORS/fetch errors).

Using Python 3:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## License & Disclaimer

This project is a fan-driven preservation effort. *Sonic the Comic*, Sonic the Hedgehog, and all related characters and elements are copyright and trademarks of SEGA, Fleetway Editions, and their respective owners. This archive is provided strictly for educational and archival purposes.
