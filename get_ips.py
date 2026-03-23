import socket
import os

def get_ip_addresses():
    hostname = socket.gethostname()
    addresses = socket.getaddrinfo(hostname, None)
    ipv4_addresses = []
    for addr in addresses:
        # Filter for IPv4
        if addr[0] == socket.AF_INET:
            ipv4_addresses.append(addr[4][0])
    return list(set(ipv4_addresses))

if __name__ == "__main__":
    ips = get_ip_addresses()
    print("Detected IPs:")
    for ip in ips:
        if not ip.startswith("127."):
            print(f"- {ip}")
