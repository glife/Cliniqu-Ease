# gateway.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from typing import List, Optional
import threading

app = FastAPI(title="API Gateway")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

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
    appointment_id: int
    symptoms: List[str]

class BuyPrescriptionRequest(BaseModel):
    appointment_id: int

class RatingRequest(BaseModel):
    user_id: int
    rating: int  # 1-5

class RescheduleRequest(BaseModel):
    new_time_slot: str

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

# ---------- Health check endpoint ----------
@app.get("/health")
def health_check():
    return {"status": "alive", "service": "API Gateway"}

# ---------- Gateway endpoints (proxy to backends) ----------
@app.post("/signup")
def signup(req: SignupRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    try:
        r = requests.post(f"http://127.0.0.1:{port}/signup", json=req.dict(), timeout=5)
        print(f"[Gateway] Forwarded /signup request to backend {port}")
        return r.json()
    except Exception as e:
        print(f"[Gateway] Error in signup: {e}")
        raise HTTPException(status_code=500, detail=f"Backend error: {str(e)}")

@app.post("/login")
def login(req: LoginRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    try:
        r = requests.post(f"http://127.0.0.1:{port}/login", json=req.dict(), timeout=5)
        print(f"[Gateway] Forwarded /login request to backend {port}")
        return r.json()
    except Exception as e:
        print(f"[Gateway] Error in login: {e}")
        raise HTTPException(status_code=500, detail=f"Backend error: {str(e)}")

@app.get("/doctors")
def get_doctors():
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/doctors", timeout=5)
    print(f"[Gateway] Forwarded /doctors request to backend {port}")
    return r.json()

@app.get("/doctors/{doctor_id}/available")
def get_doctor_available(doctor_id: int):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/doctors/{doctor_id}/available", timeout=5)
    print(f"[Gateway] Forwarded /doctors/{doctor_id}/available request to backend {port}")
    return r.json()

@app.post("/book")
def book(req: BookRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/book", json=req.dict(), timeout=5)
    print(f"[Gateway] Forwarded /book request to backend {port}")
    return r.json()

@app.post("/consult")
def consult(req: ConsultRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/consult", json=req.dict(), timeout=5)
    print(f"[Gateway] Forwarded /consult request to backend {port}")
    return r.json()

@app.get("/medicines")
def get_medicines(appointment_id: Optional[int] = Query(None)):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    url = f"http://127.0.0.1:{port}/medicines"
    if appointment_id is not None:
        url += f"?appointment_id={appointment_id}"
    r = requests.get(url, timeout=5)
    print(f"[Gateway] Forwarded /medicines request to backend {port}")
    return r.json()

@app.post("/buy")
def buy(req: BuyRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/buy", json=req.dict(), timeout=5)
    print(f"[Gateway] Forwarded /buy request to backend {port}")
    return r.json()

@app.post("/buy_bulk")
def buy_bulk(req: BuyBulkRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/buy_bulk", json=req.dict(), timeout=5)
    print(f"[Gateway] Forwarded /buy_bulk request to backend {port}")
    return r.json()

@app.post("/buy_prescription")
def buy_prescription(req: BuyPrescriptionRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/buy_prescription", json=req.dict(), timeout=5)
    print(f"[Gateway] Forwarded /buy_prescription request to backend {port}")
    return r.json()

@app.get("/users/{user_id}/appointments")
def list_appointments(user_id: int):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/users/{user_id}/appointments", timeout=5)
    print(f"[Gateway] Forwarded /users/{user_id}/appointments request to backend {port}")
    return r.json()

@app.get("/users/{user_id}/prescriptions")
def list_prescriptions(user_id: int):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/users/{user_id}/prescriptions", timeout=5)
    print(f"[Gateway] Forwarded /users/{user_id}/prescriptions request to backend {port}")
    return r.json()

@app.delete("/appointments/{appointment_id}")
def cancel_appointment(appointment_id: int):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.delete(f"http://127.0.0.1:{port}/appointments/{appointment_id}", timeout=5)
    print(f"[Gateway] Forwarded /appointments/{appointment_id} request to backend {port}")
    return r.json()

@app.post("/appointments/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: int, req: RescheduleRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/appointments/{appointment_id}/reschedule", json=req.dict(), timeout=5)
    print(f"[Gateway] Forwarded /appointments/{appointment_id}/reschedule request to backend {port}")
    return r.json()

@app.get("/medicines/search")
def search_medicines(name: str):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/medicines/search?name={name}", timeout=5)
    print(f"[Gateway] Forwarded /medicines/search request to backend {port}")
    return r.json()

@app.post("/medicines/{medicine_id}/restock")
def restock_medicine(medicine_id: int, quantity: int):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/medicines/{medicine_id}/restock?quantity={quantity}", timeout=5)
    print(f"[Gateway] Forwarded /medicines/{medicine_id}/restock request to backend {port}")
    return r.json()

@app.post("/ratings/{doctor_id}")
def rate_doctor(doctor_id: int, req: RatingRequest):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.post(f"http://127.0.0.1:{port}/ratings/{doctor_id}", json=req.dict(), timeout=5)
    print(f"[Gateway] Forwarded post/ratings/{doctor_id} request to backend {port}")
    return r.json()

@app.get("/ratings/{doctor_id}")
def get_doctor_rating(doctor_id: int):
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/ratings/{doctor_id}", timeout=5)
    print(f"[Gateway] Forwarded get/ratings/{doctor_id} request to backend {port}")
    return r.json()

@app.get("/reports/sales")
def sales_report():
    port = get_alive_server()
    if not port: raise HTTPException(status_code=500, detail="No backends")
    r = requests.get(f"http://127.0.0.1:{port}/reports/sales", timeout=5)
    print(f"[Gateway] Forwarded /reports/sales request to backend {port}")
    return r.json()

# ---------- Run Gateway ----------
if __name__ == "__main__":
    import uvicorn
    print("Starting API Gateway on port 8004...")
    uvicorn.run("gateway_fixed:app", host="127.0.0.1", port=8004, reload=True)
