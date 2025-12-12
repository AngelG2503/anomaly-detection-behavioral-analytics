import time
import threading
import requests
from scapy.all import sniff, IP, TCP, UDP

# Your FastAPI ML backend URL
API_URL = "http://localhost:8000/api/predict/network"
LOGIN_URL = "http://localhost:8000/api/auth/login"  # Adjust if needed

# Global variables
TOKEN = None
flows = {}
FLOW_TIMEOUT = 60  # seconds, flow inactivity timeout

# List of all 78 features expected by your model, initialized as keys with default 0
feature_keys = [
    "Destination Port", "Flow Duration", "Total Fwd Packets", "Total Backward Packets", 
    "Total Length of Fwd Packets", "Total Length of Bwd Packets", "Fwd Packet Length Max", 
    "Fwd Packet Length Min", "Fwd Packet Length Mean", "Fwd Packet Length Std", "Bwd Packet Length Max", 
    "Bwd Packet Length Min", "Bwd Packet Length Mean", "Bwd Packet Length Std", "Flow Bytes/s", 
    "Flow Packets/s", "Flow IAT Mean", "Flow IAT Std", "Flow IAT Max", "Flow IAT Min", "Fwd IAT Total", 
    "Fwd IAT Mean", "Fwd IAT Std", "Fwd IAT Max", "Fwd IAT Min", "Bwd IAT Total", "Bwd IAT Mean", 
    "Bwd IAT Std", "Bwd IAT Max", "Bwd IAT Min", "Fwd PSH Flags", "Bwd PSH Flags", "Fwd URG Flags", 
    "Bwd URG Flags", "Fwd Header Length", "Bwd Header Length", "Fwd Packets/s", "Bwd Packets/s", 
    "Min Packet Length", "Max Packet Length", "Packet Length Mean", "Packet Length Std", 
    "Packet Length Variance", "FIN Flag Count", "SYN Flag Count", "RST Flag Count", "PSH Flag Count", 
    "ACK Flag Count", "URG Flag Count", "CWE Flag Count", "ECE Flag Count", "Down/Up Ratio", 
    "Average Packet Size", "Avg Fwd Segment Size", "Avg Bwd Segment Size", "Fwd Header Length.1", 
    "Fwd Avg Bytes/Bulk", "Fwd Avg Packets/Bulk", "Fwd Avg Bulk Rate", "Bwd Avg Bytes/Bulk", 
    "Bwd Avg Packets/Bulk", "Bwd Avg Bulk Rate", "Subflow Fwd Packets", "Subflow Fwd Bytes", 
    "Subflow Bwd Packets", "Subflow Bwd Bytes", "Init_Win_bytes_forward", "Init_Win_bytes_backward", 
    "act_data_pkt_fwd", "min_seg_size_forward", "Active Mean", "Active Std", "Active Max", 
    "Active Min", "Idle Mean", "Idle Std", "Idle Max", "Idle Min"
]

def login():
    """Login to web app and get authentication token"""
    print("\n=== Login to Anomaly Detection System ===")
    email = input("Enter email: ")  # ← Changed from username
    password = input("Enter password: ")
    
    payload = {"email": email, "password": password}  # ← Changed field name
    
    try:
        response = requests.post(LOGIN_URL, json=payload)
        if response.status_code == 200:
            data = response.json()
            token = data.get("accessToken") or data.get("token")  # ← Try both
            print("✅ Login successful!\n")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)

def get_protocol(packet):
    if packet.haslayer(TCP):
        return "tcp"
    elif packet.haslayer(UDP):
        return "udp"
    else:
        return "other"

def get_flow_key(packet):
    """
    Generate a canonical key to identify flows.
    """
    ip = packet[IP]
    proto = get_protocol(packet)
    sport = packet.sport if hasattr(packet, 'sport') else 0
    dport = packet.dport if hasattr(packet, 'dport') else 0
    return (ip.src, ip.dst, sport, dport, proto)

def init_flow():
    """
    Creates a new flow statistics dictionary with default values.
    """
    stats = {key: 0 for key in feature_keys}
    stats.update({
        "Fwd Packet Length Max": 0,
        "Bwd Packet Length Max": 0,
        "Min Packet Length": float('inf'),
        "Max Packet Length": 0,
        "Packet Length Mean": 0.0,         # to compute online mean/std later
        "Packet Length Std": 0.0,
        "Packet Length Variance": 0.0,
        "Flow Duration": 0,
        "Fwd Packets/s": 0,
        "Bwd Packets/s": 0,
        "Flow Bytes/s": 0,
        "Avg Fwd Segment Size": 0,
        "Avg Bwd Segment Size": 0,
        "Down/Up Ratio": 0,
        "Fwd Avg Bulk Rate": 0,
        "Bwd Avg Bulk Rate": 0,
        "Subflow Fwd Packets": 0,
        "Subflow Bwd Packets": 0,
        "Act_data_pkt_fwd": 0,
        # You may need to add more as you track
    })
    # Packet sizes list for variance/stats calculation
    stats['packets_sizes_list'] = []

    # Timestamp tracking
    stats['start_time'] = None
    stats['end_time'] = None
    stats['last_seen'] = time.time()
    return stats

def update_flow_stats(flow, packet):
    """
    Updates flow statistics given a new packet from the flow.
    """
    length = len(packet)
    now_time = packet.time
    flow['last_seen'] = time.time()

    if flow['start_time'] is None:
        flow['start_time'] = now_time
    flow['end_time'] = now_time
    flow['Flow Duration'] = flow['end_time'] - flow['start_time']

    # Update packets count/direction
    if packet.haslayer(IP):
        src = packet[IP].src
        # directional update can be improved by session context (not shown here)
        flow['Total Fwd Packets'] += 1  # Assuming all packets are forward for demo
        flow['packets_sizes_list'].append(length)
        flow['Total Length of Fwd Packets'] += length

        # Update max/min packet length
        if length > flow["Fwd Packet Length Max"]:
            flow["Fwd Packet Length Max"] = length
        if length < flow["Fwd Packet Length Min"] or flow["Fwd Packet Length Min"] == 0:
            flow["Fwd Packet Length Min"] = length

        # Update max/min total
        if length > flow.get("Max Packet Length", 0):
            flow["Max Packet Length"] = length
        if length < flow.get("Min Packet Length", float('inf')):
            flow["Min Packet Length"] = length

        # You can implement mean/std/variance updates using Welford's Algorithm or numpy later

        # TODO: Add full feature calculations (packet timing, IAT, flags etc.)
        
    # For demo, simplifying, needs refining for production usage

def send_flow_for_prediction(flow):
    """
    Prepare a JSON-compatible dict with all 78 features (remove helper keys),
    send as POST json to backend, handle response.
    """
    if TOKEN is None:
        print("No auth token available.")
        return

    # Remove helper keys not part of feature set
    to_send = {k: v for k, v in flow.items() if k in feature_keys}

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.post(API_URL, json=to_send, headers=headers)
        resp.raise_for_status()
        result = resp.json()
        if result.get("is_anomaly") or result.get("data", {}).get("is_anomaly"):
            print(f"⚠️ Anomaly detected: {result}")
        else:
            print("✅ Normal traffic")
    except Exception as e:
        print(f"Error sending flow data: {e}")

def expire_and_process_flows():
    """
    Background thread to expire inactive flows and send them for prediction.
    """
    while True:
        now = time.time()
        expired_keys = []
        for key, flow in list(flows.items()):
            if now - flow['last_seen'] > FLOW_TIMEOUT:
                print(f"💧 Flow expired: {key}")
                send_flow_for_prediction(flow)
                expired_keys.append(key)
        for key in expired_keys:
            del flows[key]
        time.sleep(5)

def packet_handler(packet):
    """
    Called by sniff() for every captured packet.
    Updates or initializes flows and their stats.
    """
    try:
        if not packet.haslayer(IP):
            return

        key = get_flow_key(packet)

        if key not in flows:
            flows[key] = init_flow()

        update_flow_stats(flows[key], packet)
    except Exception as e:
        print(f"Exception in packet_handler: {e}")

if __name__ == "__main__":
    login()
    print("Starting live network packet capture. Press Ctrl+C to stop.")

    # Start background thread for expiring flows
    threading.Thread(target=expire_and_process_flows, daemon=True).start()

    # Start sniffing network packets
    sniff(prn=packet_handler, store=False)
