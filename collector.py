from scapy.all import sniff, IP, TCP, UDP
import requests
import psutil

API_URL = "http://127.0.0.1:8000/analyze"

# Cache for port → process lookup
port_process_cache = {}

def get_process_name(port):
    """Find which process owns the given local port"""
    if port in port_process_cache:
        return port_process_cache[port]

    for conn in psutil.net_connections(kind="inet"):
        if conn.laddr and conn.laddr.port == port and conn.pid:
            try:
                pname = psutil.Process(conn.pid).name()
                port_process_cache[port] = pname
                return pname
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    return None

def packet_to_record(pkt):
    """Convert Scapy packet to our JSON format with process info"""
    if pkt.haslayer(IP):
        proto = "OTHER"
        port = None
        pname = None

        if pkt.haslayer(TCP):
            proto = "TCP"
            port = pkt[TCP].sport
        elif pkt.haslayer(UDP):
            proto = "UDP"
            port = pkt[UDP].sport

        if port:
            pname = get_process_name(port)

        return {
            "src_ip": pkt[IP].src,
            "dst_ip": pkt[IP].dst,
            "bytes": len(pkt),
            "packets": 1,
            "protocol": proto,
            "process": pname or "Unknown"
        }

def handle_packet(pkt):
    record = packet_to_record(pkt)
    if record:
        data = {"records": [record]}
        try:
            response = requests.post(API_URL, json=data)
            print(record, "=>", response.json())
        except Exception as e:
            print("❌ Error sending packet:", e)

if __name__ == "__main__":
    print("📡 Capturing packets with process info... (Ctrl+C to stop)")
    sniff(prn=handle_packet, store=False)
