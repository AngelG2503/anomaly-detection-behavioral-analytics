import time
import os
import pickle
from datetime import datetime
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import base64
import email as email_lib

API_URL = "https://anomaly-detection-behavioral-analytics.onrender.com/api/email/submit"
LOGIN_URL = "https://anomaly-detection-behavioral-analytics.onrender.com/api/auth/login"

# Gmail API scopes
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']


def get_gmail_service():
    """Authenticate and return Gmail API service"""
    creds = None

    # Token file stores user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    # If no valid credentials, let user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("\n🔐 Opening browser for Google authentication...")
            print("   Please log in and authorize the app.\n")
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save credentials for next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return build('gmail', 'v1', credentials=creds)


def login():
    """Login to web app and get authentication token"""
    print("\n=== Login to Anomaly Detection System ===")
    email = input("Enter email: ")
    password = input("Enter password: ")

    payload = {"email": email, "password": password}

    try:
        response = requests.post(LOGIN_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            token = data.get("accessToken") or data.get("token")
            print("✅ Login successful!\n")
            return token
        else:
            print("❌ Login failed. Please check your credentials.")
            exit(1)
    except Exception as e:
        print(f"❌ Error connecting to server: {e}")
        exit(1)


def extract_email_info(payload):
    """Extract email information from Gmail API payload"""
    headers = payload.get('payload', {}).get('headers', [])

    sender = next((h['value'] for h in headers if h['name'] == 'From'), '')
    recipient = next((h['value'] for h in headers if h['name'] == 'To'), '')
    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')

    # Get email body
    body = ""
    if 'parts' in payload.get('payload', {}):
        for part in payload['payload']['parts']:
            if part.get('mimeType') == 'text/plain':
                if 'data' in part.get('body', {}):
                    body = base64.urlsafe_b64decode(
                        part['body']['data']
                    ).decode('utf-8', errors='ignore')
                    break

    # Count attachments
    parts = payload.get('payload', {}).get('parts', [])
    attachment_count = len([p for p in parts if p.get('filename')])

    return {
        "sender": sender,
        "recipient": recipient,
        "subject": subject,
        "email_size": int(payload.get('sizeEstimate', 0)),
        "body_length": len(body),
        "attachment_count": attachment_count,
        "num_recipients": 1,
        "time_sent": datetime.now().isoformat(),
    }


def send_data(data, token):
    """Send email data to ML backend API"""

    # Transform data to match EmailFeatures schema
    ml_payload = {
        "timestamp": data["time_sent"],
        "sender_email": data["sender"],
        "receiver_email": data["recipient"],
        "num_recipients": data["num_recipients"],
        "email_size": data["email_size"],
        "has_attachment": data["attachment_count"] > 0,
        "num_attachments": data["attachment_count"],
        "subject_length": len(data["subject"]),
        "body_length": data["body_length"],
        "is_reply": data["subject"].startswith(("Re:", "RE:")),
        "is_forward": data["subject"].startswith(("Fwd:", "FW:")),
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    try:
        # 1) Call ML backend
        ml_response = requests.post(
            "https://anomaly-detection-ml-backend.onrender.com/predict/email",
            json=ml_payload,
        )

        if ml_response.status_code != 200:
            print("ML API error:", ml_response.status_code, ml_response.text)
            return

        ml_result = ml_response.json()
        print("ML RESULT:", ml_result)

        # 2) Decide anomaly using threshold
        score = float(ml_result.get("anomaly_score", 0.0))
        is_anomaly = score >= 0.7
        print("DECISION -> score:", score, "is_anomaly:", is_anomaly)

        # 3) Attach fields exactly as Node + React expect
        data["is_anomaly"] = is_anomaly
        data["anomaly_score"] = score
        data["threat_class"] = ml_result.get("threat_class", "normal")
        data["confidence"] = float(ml_result.get("confidence", 0.0))

        # 4) Save into Node backend
        print("POSTING TO URL:", API_URL)
        resp = requests.post(API_URL, json=data, headers=headers)
        print("NODE SAVE STATUS:", resp.status_code, resp.text[:200])

        # 5) Log what happened
        if is_anomaly:
            print(f"⚠️  ANOMALY: {data['subject'][:50]}")
        else:
            print(f"✅ Normal: {data['subject'][:50]}")

    except Exception as e:
        print("Error sending data:", e)


def monitor_emails(service, token):
    """Monitor Gmail inbox using Gmail API"""
    print("📧 Email Monitor started (Ctrl+C to stop)...\n")

    seen_ids = set()

    while True:
        try:
            # Get unread messages
            results = service.users().messages().list(
                userId='me',
                labelIds=['INBOX'],
                q='is:unread'
            ).execute()

            messages = results.get('messages', [])

            for msg in messages:
                msg_id = msg['id']

                if msg_id not in seen_ids:
                    # Get full message
                    message = service.users().messages().get(
                        userId='me',
                        id=msg_id
                    ).execute()

                    email_info = extract_email_info(message)
                    send_data(email_info, token)

                    seen_ids.add(msg_id)

            time.sleep(30)

        except Exception as e:
            print(f"Error: {e}")
            time.sleep(30)


if __name__ == "__main__":
    print("=" * 60)
    print("EMAIL MONITOR WITH GOOGLE OAUTH2")
    print("=" * 60)
    print("\n🔐 First time? Your browser will open for Google login.")
    print("   After authorization, credentials are saved locally.\n")

    # Step 1: Get Gmail service (OAuth2)
    try:
        service = get_gmail_service()
        print("✅ Gmail authentication successful!\n")
    except Exception as e:
        print(f"❌ Error with Gmail authentication: {e}")
        print("\nMake sure 'credentials.json' is in the same folder as this script.")
        exit(1)

    # OPTION A (for later): normal login flow
    TOKEN = login()

    # OPTION B (for testing): use existing token
    # TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2MxMWJhMmU3OWM0NWNlYmVlNDdhMCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzY1NTU0NzQxLCJleHAiOjE3NjU2NDExNDF9.uhpZ9OCJMMcrqNNm6SaKtm_3HABomxHIvfw_eoX3rg4"

    # Step 3: Start monitoring
    monitor_emails(service, TOKEN)
