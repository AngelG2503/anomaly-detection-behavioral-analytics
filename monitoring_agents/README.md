# Monitoring Agents

Python scripts for real-time network and email anomaly monitoring.

## 1. Setup

- Install Python 3.x

- In this folder run:

pip install -r requirements.txt

## 2. Configuration

**For both scripts:**
- Set your user authentication TOKEN at the top (get it from: `localStorage.getItem('token')` in your browser's dev console after logging in to the app).

**For email_monitor.py:**  
- Fill in your email ID, password (app password if using Gmail), and IMAP server.

## 3. Usage

**Network monitoring (needs admin/sudo):**
sudo python network_monitor.py

## 4. What they do

- `network_monitor.py` captures packets, submits to the backend, and prints detection results in real time.
- `email_monitor.py` checks your inbox for new emails, submits details, and prints results.

The backend, frontend dashboard, and ML service must be running for end-to-end results!
