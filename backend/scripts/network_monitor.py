import time
import requests
from scapy.all import sniff, IP, TCP, UDP


API_URL = "http://localhost:3000/api/network/submit"
LOGIN_URL = "http://localhost:3000/api/auth/login"


# Login function to get token automatically
def login():
    print("\n=== Login to Anomaly Detection System ===")
    username = input("Enter username: ")
    password = input("Enter password: ")
    
    payload = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(LOGIN_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            print("✅ Login successful!\n")
            return token
        else:
            print("❌ Login failed. Please check your credentials.")
            exit(1)
    except Exception as e:
        print(f"❌ Error connecting to server: {e}")
        exit(1)


# Get token by logging in
TOKEN = login()


def get_protocol(packet):
    if packet.haslayer(TCP):
        return "tcp"
    elif packet.haslayer(UDP):
        return "udp"
    else:
        return "other"


def extract_packet(packet):
    if packet.haslayer(IP):
        ip_layer = packet[IP]
        data = {
            "source_ip": ip_layer.src,
            "destination_ip": ip_layer.dst,
            "protocol": get_protocol(packet),
            "packet_size": len(packet),
            "connection_duration": 0,
            "port_number": 0,
            "packets_sent": 1,
            "packets_received": 0,
            "bytes_sent": len(packet),
            "bytes_received": 0,
        }
        if packet.haslayer(TCP):
            data["port_number"] = packet[TCP].dport
        elif packet.haslayer(UDP):
            data["port_number"] = packet[UDP].dport
        return data
    return None


def send_data(data):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.post(API_URL, json=data, headers=headers)
        if resp.status_code == 200:
            result = resp.json()
            if result["data"]["is_anomaly"]:
                print(f"⚠️ Anomaly detected: {result['data']['threat_class']}")
            else:
                print("✅ Normal traffic")
        else:
            print(f"API error: {resp.status_code}")
    except Exception as e:
        print(f"Error sending data: {e}")


def process_packet(packet):
    data = extract_packet(packet)
    if data:
        print(f"Captured: {data['source_ip']} → {data['destination_ip']} | Protocol: {data['protocol']}")
        send_data(data)


if __name__ == "__main__":
    print("\nNetwork Monitor started (press Ctrl+C to stop)...\n")
    sniff(prn=process_packet)
