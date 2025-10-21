# gateway.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from typing import List
import threading

app = FastAPI(title="API Gateway")

# ---------- Backend server list ----------
BACKEND_PORTS = [8001, 8002, 8003]
rr_index = 0
lock = threading.Lock()

# ---------- Pydantic Models ----------
class BuyItem(BaseModel):
    medicine_id: int
    quantity: int

class BuyBulkRequest(BaseModel):
    user_id: int
    items: List[BuyItem]

class BuyRequest(BaseModel):
    name: str
    medicine_id: int
    quantity: int

class SignupRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class BookRequest(BaseModel):
    user_id: int
    doctor_id: int
    time_slot: str

class ConsultRequest(BaseModel):
    user_id: int
    doctor_id: int
    symptoms: List[str]

# ---------- Helper Functions ----------
def get_alive_server():
    global rr_index
    checked = 0
    total_servers = len(BACKEND_PORTS)
    while checked < total_servers:
        with lock:
            port = BACKEND_PORTS[rr_index]
            rr_index = (rr_index + 1) % total_servers
        try:
            r = requests.get(f"http://127.0.0.1:{port}/health", timeout=1)
            if r.status_code == 200:
                return port
        except:
            print(f"[Gateway] Backend {port} not reachable")
        checked += 1
    return None

# ---------- Gateway endpoints (proxy to backends) ----------
@app.post("/signup")
def signup(req: SignupRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/signup", json=req.dict(), timeout=2)
    print(f"[Gateway] Forwarded /signup request to backend {port}")
    return r.json()

@app.post("/login")
def login(req: LoginRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/login", json=req.dict(), timeout=2)
    print(f"[Gateway] Forwarded /login request to backend {port}")
    return r.json()

@app.get("/doctors")
def get_doctors():
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/doctors", timeout=2)
    print(f"[Gateway] Forwarded /doctors request to backend {port}")
    return r.json()

@app.get("/doctors/{doctor_id}/available")
def get_doctor_available(doctor_id: int):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/doctors/{doctor_id}/available", timeout=2)
    print(f"[Gateway] Forwarded /medicines request to backend {port}")
    return r.json()

@app.post("/book")
def book(req: BookRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/book", json=req.dict(), timeout=2)
    print(f"[Gateway] Forwarded /medicines request to backend {port}")
    return r.json()

@app.post("/consult")
def consult(req: ConsultRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/consult", json=req.dict(), timeout=2)
    print(f"[Gateway] Forwarded /medicines request to backend {port}")
    return r.json()

@app.get("/medicines")
def get_medicines():
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/medicines", timeout=2)
    print(f"[Gateway] Forwarded /medicines request to backend {port}")
    return r.json()

@app.post("/buy")
def buy(req: BuyRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/buy", json=req.dict(), timeout=2)
    return r.json()

@app.post("/buy_bulk")
def buy_bulk(req: BuyBulkRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/buy_bulk", json=req.dict(), timeout=5)
    return r.json()