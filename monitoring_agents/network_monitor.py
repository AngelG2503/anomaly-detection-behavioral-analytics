import time
import requests
from scapy.all import sniff, IP, TCP, UDP
from collections import defaultdict
from datetime import datetime


API_URL = "http://localhost:3000/api/network/submit"
ML_API_URL = "http://localhost:8000/predict/network"
LOGIN_URL = "http://localhost:3000/api/auth/login"


# Track flows (connections)
flows = defaultdict(lambda: {
    "packets_sent": 0,
    "packets_received": 0,
    "bytes_sent": 0,
    "bytes_received": 0,
    "start_time": None,
    "protocol": None,
    "port": 0
})


def login():
    """Login to web app and get authentication token"""
    print("\n=== Login to Anomaly Detection System ===")
    username = input("Enter username: ")
    password = input("Enter password: ")
    
    payload = {"username": username, "password": password}
    
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


TOKEN = login()


def get_flow_key(packet):
    """Create unique flow identifier"""
    if packet.haslayer(IP):
        ip = packet[IP]
        return f"{ip.src}:{ip.dst}"
    return None


def get_protocol(packet):
    """Get protocol type"""
    if packet.haslayer(TCP):
        return "tcp"  # ✅ Changed from "TCP"
    elif packet.haslayer(UDP):
        return "udp"  # ✅ Changed from "UDP"
    else:
        return "other"  # ✅ Changed from "OTHER"



def update_flow(packet):
    """Update flow statistics"""
    if not packet.haslayer(IP):
        return None
    
    flow_key = get_flow_key(packet)
    if not flow_key:
        return None
    
    ip = packet[IP]
    flow = flows[flow_key]
    
    # Initialize flow if new
    if flow["start_time"] is None:
        flow["start_time"] = time.time()
        flow["protocol"] = get_protocol(packet)
        
        # Get port number
        if packet.haslayer(TCP):
            flow["port"] = packet[TCP].dport
        elif packet.haslayer(UDP):
            flow["port"] = packet[UDP].dport
    
    # Update counters
    flow["packets_sent"] += 1
    flow["bytes_sent"] += len(packet)
    
    return flow_key


def send_flow_data(flow_key):
    """Send aggregated flow data to ML API"""
    flow = flows[flow_key]
    src_ip, dst_ip = flow_key.split(":")
    
    duration = time.time() - flow["start_time"]
    
    # Prepare data matching your ML API schema
    ml_payload = {
        "timestamp": datetime.now().isoformat(),
        "source_ip": src_ip,
        "destination_ip": dst_ip,
        "protocol": flow["protocol"],
        "packet_size": flow["bytes_sent"] / max(flow["packets_sent"], 1),
        "connection_duration": duration,
        "port_number": flow["port"],
        "packets_sent": flow["packets_sent"],
        "packets_received": flow["packets_received"],
        "bytes_sent": flow["bytes_sent"],
        "bytes_received": flow["bytes_received"]
    }
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        # Send to ML backend
        ml_response = requests.post(ML_API_URL, json=ml_payload)
        
        if ml_response.status_code == 200:
            ml_result = ml_response.json()
            
            # Send to Node.js backend with ML results
            data = {
                **ml_payload,
                "is_anomaly": ml_result["is_anomaly"],
                "anomaly_score": ml_result["anomaly_score"],
                "threat_class": ml_result["threat_class"],
                "confidence": ml_result["confidence"]
            }
            
            resp = requests.post(API_URL, json=data, headers=headers)
            
            if ml_result["is_anomaly"]:
                print(f"⚠️  ANOMALY: {src_ip} → {dst_ip}")
                print(f"   Threat: {ml_result['threat_class']} (Confidence: {ml_result['confidence']:.2%})")
                print(f"   Packets: {flow['packets_sent']}, Bytes: {flow['bytes_sent']}, Port: {flow['port']}\n")
            else:
                print(f"✅ Normal: {src_ip} → {dst_ip} (Port {flow['port']})")
                
        else:
            print(f"ML API error: {ml_response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")


def process_packet(packet):
    """Process captured packet"""
    flow_key = update_flow(packet)
    
    if flow_key:
        flow = flows[flow_key]
        
        # Send data after collecting enough packets (threshold)
        if flow["packets_sent"] >= 10:  # Adjust threshold as needed
            send_flow_data(flow_key)
            # Reset flow
            del flows[flow_key]


def periodic_send():
    """Periodically send old flows"""
    while True:
        time.sleep(30)  # Every 30 seconds
        current_time = time.time()
        
        flows_to_send = []
        for flow_key, flow in list(flows.items()):
            if flow["start_time"] and (current_time - flow["start_time"]) > 30:
                flows_to_send.append(flow_key)
        
        for flow_key in flows_to_send:
            send_flow_data(flow_key)
            del flows[flow_key]


if __name__ == "__main__":
    print("\n" + "="*60)
    print("NETWORK MONITOR - ML-POWERED ANOMALY DETECTION")
    print("="*60)
    print("\n📡 Monitoring network traffic (Ctrl+C to stop)...\n")
    
    # Start periodic sender in background
    import threading
    sender_thread = threading.Thread(target=periodic_send, daemon=True)
    sender_thread.start()
    
    # Start packet capture
    sniff(prn=process_packet, store=False)
