#!/usr/bin/env python3
"""
Startup script for MedCare backend
This script starts the gateway and backend servers
"""
import subprocess
import sys
import time
import os
import signal

def start_server(port, all_ports):
    """Start a backend server"""
    cmd = [sys.executable, "backend/main.py", str(port), ",".join(map(str, all_ports))]
    print(f"Running command: {' '.join(cmd)}")
    return subprocess.Popen(cmd, cwd=os.getcwd(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def start_gateway():
    """Start the API gateway"""
    cmd = [sys.executable, "backend/gateway.py"]
    print(f"Running command: {' '.join(cmd)}")
    return subprocess.Popen(cmd, cwd=os.getcwd(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def main():
    print("Starting MedCare Backend...")
    
    # Define server ports
    backend_ports = [8001, 8002, 8003]
    gateway_port = 8000
    
    processes = []
    
    try:
        # Start backend servers
        for port in backend_ports:
            print(f"Starting backend server on port {port}...")
            proc = start_server(port, backend_ports)
            processes.append(proc)
            time.sleep(2)  # Give servers time to start
        
        # Start gateway
        print(f"Starting API gateway on port {gateway_port}...")
        gateway_proc = start_gateway()
        processes.append(gateway_proc)
        time.sleep(2)  # Give gateway time to start
        
        print("\n[SUCCESS] Backend servers started successfully!")
        print(f"[INFO] API Gateway: http://127.0.0.1:{gateway_port}")
        print(f"[INFO] Backend servers: {backend_ports}")
        print("\nPress Ctrl+C to stop all servers")
        
        # Wait for processes
        for proc in processes:
            proc.wait()
            
    except KeyboardInterrupt:
        print("\n[STOP] Stopping servers...")
        for proc in processes:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except:
                proc.kill()
        print("[SUCCESS] All servers stopped")
    except Exception as e:
        print(f"Error: {e}")
        for proc in processes:
            try:
                proc.terminate()
            except:
                pass

if __name__ == "__main__":
    main()
