# main.py
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Optional
import requests
import sys
import threading
import time
import itertools

# ---------- Config ----------
if len(sys.argv) != 3:
    print("Usage: python main.py <port> <all_server_ports_comma_separated>")
    sys.exit(1)

PORT = int(sys.argv[1])
ALL_PORTS = list(map(int, sys.argv[2].split(',')))
OTHER_PORTS = [p for p in ALL_PORTS if p != PORT]

app = FastAPI(title=f"Backend Server {PORT}")

# ---------- In-memory DB (shared state replicated by coordinator) ----------
MEDICINES: List[Dict] = [
    {"id": 0, "name": "Paracetamol", "stock": 10, "price": 20},
    {"id": 1, "name": "Ibuprofen", "stock": 5, "price": 30},
    {"id": 2, "name": "Amoxicillin", "stock": 7, "price": 50},
]
USERS: List[Dict] = []        # each: {id, username, password}
APPOINTMENTS: List[Dict] = [] # each: {id, user_id, doctor_id, time_slot, symptoms, prescription}
DOCTORS: List[Dict] = [
    {"id": 0, "name": "Dr. Mehta", "specialty": "General", "available_slots": ["10:00", "11:00", "15:00"]},
    {"id": 1, "name": "Dr. Rao", "specialty": "Pediatrics", "available_slots": ["09:30", "13:00", "16:00"]},
]

lock = threading.Lock()
_id_counter = itertools.count(start=1)

# ---------- Models ----------
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

# ---------- Coordinator & Clock ----------
coordinator_port = max(ALL_PORTS)
logical_clock = time.time()

HEALTH_TIMEOUT = 1.0
REQ_TIMEOUT = 2.0

# ---------- Helper functions ----------
def is_alive(port: int) -> bool:
    try:
        r = requests.get(f"http://127.0.0.1:{port}/health", timeout=HEALTH_TIMEOUT)
        return r.status_code == 200
    except:
        return False

def elect_coordinator():
    global coordinator_port
    alive = []
    for p in ALL_PORTS:
        if p == PORT:
            alive.append(p)
            continue
        if is_alive(p):
            alive.append(p)
    new = max(alive)
    old = coordinator_port
    coordinator_port = new
    if old != new:
        print(f"[Server {PORT}] Election complete. New coordinator: {coordinator_port}")
        for p in OTHER_PORTS:
            try:
                requests.post(f"http://127.0.0.1:{p}/update_coordinator",
                              json={"port": coordinator_port}, timeout=REQ_TIMEOUT)
            except:
                pass

def ensure_coordinator_alive_check():
    global coordinator_port
    if coordinator_port == PORT:
        return coordinator_port
    if is_alive(coordinator_port):
        return coordinator_port
    print(f"[Server {PORT}] Coordinator {coordinator_port} unreachable. Starting election...")
    elect_coordinator()
    return coordinator_port

def async_clock_sync():
    def _sync():
        global logical_clock
        try:
            if coordinator_port == PORT:
                logical_clock = time.time()
                return
            t0 = time.time()
            r = requests.get(f"http://127.0.0.1:{coordinator_port}/time", timeout=REQ_TIMEOUT)
            t1 = time.time()
            if r.status_code == 200:
                master_time = r.json().get("time", time.time())
                rtt = t1 - t0
                logical_clock = master_time + rtt / 2
                # print small debug
                print(f"[Server {PORT}] Clock synced with coordinator {coordinator_port}: {logical_clock}")
        except:
            pass
    threading.Thread(target=_sync, daemon=True).start()

def push_full_state_to_replicas():
    """Coordinator pushes full application state to replicas."""
    snapshot = {
        "medicines": MEDICINES,
        "users": USERS,
        "appointments": APPOINTMENTS,
    }
    def _push():
        for p in OTHER_PORTS:
            try:
                requests.post(f"http://127.0.0.1:{p}/push_state", json=snapshot, timeout=REQ_TIMEOUT)
            except Exception as e:
                print(f"[Server {PORT}] Failed to push state to {p}: {e}")
    threading.Thread(target=_push, daemon=True).start()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Internal endpoints ----------
@app.get("/health")
def health_check():
    return {"status": "alive"}

@app.get("/time")
def time_endpoint():
    return {"time": time.time()}

@app.post("/update_coordinator")
def update_coordinator(payload: dict):
    global coordinator_port
    new = payload.get("port")
    if new and isinstance(new, int):
        old = coordinator_port
        coordinator_port = new
        if old != new:
            print(f"[Server {PORT}] Coordinator updated to {coordinator_port} (via notification)")
        return {"status": "ok"}
    raise HTTPException(status_code=400, detail="invalid payload")

@app.post("/push_state")
def push_state(payload: dict):
    """Replace local replicated state with coordinator snapshot (best-effort)."""
    global MEDICINES, USERS, APPOINTMENTS
    meds = payload.get("medicines")
    users = payload.get("users")
    apps = payload.get("appointments")
    if not isinstance(meds, list) or not isinstance(users, list) or not isinstance(apps, list):
        raise HTTPException(status_code=400, detail="invalid state payload")
    with lock:
        MEDICINES = [m.copy() for m in meds]
        USERS = [u.copy() for u in users]
        APPOINTMENTS = [a.copy() for a in apps]
    print(f"[Server {PORT}] Received full state snapshot from coordinator")
    return {"status": "synced"}

# ---------- Authentication endpoints ----------
@app.post("/signup")
def signup(req: SignupRequest):
    # writes must go via coordinator
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/signup", json=req.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except Exception:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable; try again")
    # coordinator handles signup
    with lock:
        uid = next(_id_counter)
        USERS.append({"id": uid, "username": req.username, "password": req.password})
    print(f"[Server {PORT}] New signup: {req.username} (id={uid})")
    push_full_state_to_replicas()
    return {"status": "SUCCESS", "user_id": uid}

@app.post("/login")
def login(req: LoginRequest):
    # login is read-only; can be served locally
    with lock:
        for u in USERS:
            if u["username"] == req.username and u["password"] == req.password:
                return {"status": "SUCCESS", "user_id": u["id"]}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# ---------- Doctor & Appointment endpoints ----------
@app.get("/doctors")
def get_doctors():
    # read-only
    return {"doctors": DOCTORS}

@app.get("/doctors/{doctor_id}/available")
def get_doctor_available(doctor_id: int):
    for d in DOCTORS:
        if d["id"] == doctor_id:
            # filter out already booked times
            with lock:
                booked = [a["time_slot"] for a in APPOINTMENTS if a["doctor_id"] == doctor_id]
            available = [t for t in d["available_slots"] if t not in booked]
            return {"doctor_id": doctor_id, "available_slots": available}
    raise HTTPException(status_code=404, detail="Doctor not found")

@app.post("/book")
def book_appointment(req: BookRequest):
    # writes go through coordinator
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/book", json=req.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except Exception:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable; try again")
    # coordinator books
    with lock:
        # simple checks
        if not any(u["id"] == req.user_id for u in USERS):
            raise HTTPException(status_code=404, detail="User not found")
        doc = next((d for d in DOCTORS if d["id"] == req.doctor_id), None)
        if not doc:
            raise HTTPException(status_code=404, detail="Doctor not found")
        # check availability
        booked = [a["time_slot"] for a in APPOINTMENTS if a["doctor_id"] == req.doctor_id]
        if req.time_slot in booked or req.time_slot not in doc["available_slots"]:
            return {"status": "FAILED", "message": "Time slot not available"}
        aid = next(_id_counter)
        APPOINTMENTS.append({"id": aid, "user_id": req.user_id, "doctor_id": req.doctor_id,
                             "time_slot": req.time_slot, "symptoms": [], "prescription": []})
    print(f"[Server {PORT}] Appointment booked: id={aid} user={req.user_id} doctor={req.doctor_id} at {req.time_slot}")
    push_full_state_to_replicas()
    return {"status": "SUCCESS", "appointment_id": aid}

@app.post("/consult")
def consult(req: ConsultRequest):
    """
    Simulate doctor consultation:
    - store symptoms into appointment (if an appointment exists for that user & doctor → latest)
    - return a simple diagnosis + prescription (list of medicine_id + qty)
    """
    # treat consult as write because it may update appointment/prescription
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/consult", json=req.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except Exception:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable; try again")
    # simple symptom -> disease mapping
    symptom_text = " ".join(req.symptoms).lower()
    if "fever" in symptom_text or "temperature" in symptom_text:
        disease = "Fever"
        prescription = [{"medicine_id": 0, "quantity": 2}]
    elif "cough" in symptom_text or "cold" in symptom_text:
        disease = "Common Cold"
        prescription = [{"medicine_id": 0, "quantity": 1}, {"medicine_id": 3 if len(MEDICINES)>3 else 0, "quantity": 1}]
    elif "pain" in symptom_text or "headache" in symptom_text:
        disease = "Headache"
        prescription = [{"medicine_id": 1, "quantity": 2}]
    else:
        disease = "General Checkup"
        prescription = [{"medicine_id": 4 if len(MEDICINES)>4 else 0, "quantity": 1}]

    # store into latest appointment if exists
    with lock:
        # find latest appointment for this user and doctor without prescription yet
        apps = [a for a in APPOINTMENTS if a["user_id"] == req.user_id and a["doctor_id"] == req.doctor_id]
        if apps:
            latest = max(apps, key=lambda x: x["id"])
            latest["symptoms"] = req.symptoms
            latest["prescription"] = prescription
            appt_id = latest["id"]
        else:
            # create a new appointment record (no timeslot)
            appt_id = next(_id_counter)
            APPOINTMENTS.append({"id": appt_id, "user_id": req.user_id, "doctor_id": req.doctor_id,
                                 "time_slot": "walk-in", "symptoms": req.symptoms, "prescription": prescription})
    print(f"[Server {PORT}] Consult done for user {req.user_id}. Diagnosis: {disease}. Prescription: {prescription}")
    push_full_state_to_replicas()
    # respond with diagnosis & prescription
    return {"diagnosis": disease, "prescription": prescription, "appointment_id": appt_id}

# ---------- Pharmacy endpoints (reads/writes) ----------
@app.get("/medicines")
def get_medicines():
    ensure_coordinator_alive_check()
    async_clock_sync()
    with lock:
        return {"medicines": MEDICINES}

@app.post("/buy")
def buy_medicine(request: BuyRequest):
    # keep backward compatibility for single-item buys
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/buy", json=request.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except Exception:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable; try again")
    with lock:
        if request.medicine_id < 0 or request.medicine_id >= len(MEDICINES):
            raise HTTPException(status_code=404, detail="Medicine not found")
        med = MEDICINES[request.medicine_id]
        if med["stock"] < request.quantity:
            return {"status": "FAILED", "message": f"Not enough stock of {med['name']}"}
        med["stock"] -= request.quantity
        snapshot = [m.copy() for m in MEDICINES]
    print(f"[Server {PORT}] (COORDINATOR) {request.name} bought {request.quantity} {med['name']}")
    push_full_state_to_replicas()
    async_clock_sync()
    return {"status": "SUCCESS", "message": f"{request.name} bought {request.quantity} {med['name']}"}

@app.post("/buy_bulk")
def buy_bulk(request: BuyBulkRequest):
    """
    Accepts a prescription or arbitrary items:
    - checks stocks for all items, if any insufficient -> FAIL (no partial)
    - otherwise coordinator decrements stocks and replicates
    """
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/buy_bulk", json=request.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except Exception:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable; try again")
    with lock:
        # check all items
        for it in request.items:
            if it.medicine_id < 0 or it.medicine_id >= len(MEDICINES):
                raise HTTPException(status_code=404, detail=f"Medicine id {it.medicine_id} not found")
            if MEDICINES[it.medicine_id]["stock"] < it.quantity:
                return {"status": "FAILED", "message": f"Not enough stock of {MEDICINES[it.medicine_id]['name']}"}
        # all ok -> decrement
        total_cost = 0
        for it in request.items:
            MEDICINES[it.medicine_id]["stock"] -= it.quantity
            total_cost += MEDICINES[it.medicine_id].get("price", 0) * it.quantity
        snapshot = [m.copy() for m in MEDICINES]
    print(f"[Server {PORT}] (COORDINATOR) User {request.user_id} bought items {request.items}")
    push_full_state_to_replicas()
    async_clock_sync()
    return {"status": "SUCCESS", "total_cost": total_cost}

# ---------- Run ----------
if __name__ == "__main__":
    print(f"Starting server on port {PORT}. Initial coordinator: {coordinator_port}")
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=PORT)