# main.py
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Request, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
import requests
import sys
import threading
import time
import itertools
#from pyspark import SparkContext, SparkConf
# ---------- Config ----------
if len(sys.argv) != 3:
    print("Usage: python main.py <port> <all_server_ports_comma_separated>")
    sys.exit(1)

PORT = int(sys.argv[1])
ALL_PORTS = list(map(int, sys.argv[2].split(',')))
OTHER_PORTS = [p for p in ALL_PORTS if p != PORT]

# conf = SparkConf().setAppName("ClinicSalesReport").setMaster("local[*]")
# sc = SparkContext.getOrCreate(conf=conf)
app = FastAPI(title=f"Backend Server {PORT}")

# ---------- In-memory DB (shared state replicated by coordinator) ----------
MEDICINES: List[Dict] = [
    {"id": 0, "name": "Paracetamol", "stock": 10, "price": 20},
    {"id": 1, "name": "Ibuprofen", "stock": 5, "price": 30},
    {"id": 2, "name": "Amoxicillin", "stock": 7, "price": 50},
    {"id": 3, "name": "Cough Syrup", "stock": 8, "price": 40},
    {"id": 4, "name": "Antacid", "stock": 15, "price": 25},
    {"id": 5, "name": "Cetirizine", "stock": 12, "price": 18},
    {"id": 6, "name": "Metformin", "stock": 9, "price": 60},
    {"id": 7, "name": "Aspirin", "stock": 20, "price": 22},
    {"id": 8, "name": "Azithromycin", "stock": 6, "price": 85},
    {"id": 9, "name": "Vitamin D3", "stock": 14, "price": 45},
    {"id": 10, "name": "Multivitamin", "stock": 17, "price": 35},
    {"id": 11, "name": "Insulin", "stock": 5, "price": 120},
    {"id": 12, "name": "Ciprofloxacin", "stock": 7, "price": 70},
    {"id": 13, "name": "Loratadine", "stock": 10, "price": 28},
    {"id": 14, "name": "Pantoprazole", "stock": 11, "price": 55},
    {"id": 15, "name": "Hydroxychloroquine", "stock": 4, "price": 150},
    {"id": 16, "name": "Doxycycline", "stock": 8, "price": 90},
    {"id": 17, "name": "Losartan", "stock": 10, "price": 65},
    {"id": 18, "name": "Amlodipine", "stock": 9, "price": 75},
    {"id": 19, "name": "Omeprazole", "stock": 16, "price": 30},
]

USERS: List[Dict] = []        # each: {id, username, password}
APPOINTMENTS: List[Dict] = [] # each: {id, user_id, doctor_id, time_slot, symptoms, prescription}
DOCTORS: List[Dict] = [
    {"id": 0, "name": "Dr. Mehta", "specialty": "General", "available_slots": ["10:00", "11:00", "15:00"]},
    {"id": 1, "name": "Dr. Rao", "specialty": "Pediatrics", "available_slots": ["09:30", "13:00", "16:00"]},
    {"id": 2, "name": "Dr. Sharma", "specialty": "Cardiology", "available_slots": ["10:30", "12:00", "14:30"]},
    {"id": 3, "name": "Dr. Kapoor", "specialty": "Neurology", "available_slots": ["09:00", "11:30", "15:30"]},
    {"id": 4, "name": "Dr. Iyer", "specialty": "Orthopedics", "available_slots": ["10:15", "13:45", "17:00"]},
    {"id": 5, "name": "Dr. Gupta", "specialty": "Dermatology", "available_slots": ["09:45", "12:30", "16:15"]},
    {"id": 6, "name": "Dr. Nair", "specialty": "ENT", "available_slots": ["10:00", "14:00", "15:30"]},
    {"id": 7, "name": "Dr. Singh", "specialty": "Ophthalmology", "available_slots": ["09:15", "11:45", "14:45"]},
    {"id": 8, "name": "Dr. Bose", "specialty": "Psychiatry", "available_slots": ["10:40", "13:20", "16:10"]},
    {"id": 9, "name": "Dr. Desai", "specialty": "Gynecology", "available_slots": ["09:00", "12:15", "15:45"]},
    {"id": 10, "name": "Dr. Kulkarni", "specialty": "Oncology", "available_slots": ["10:20", "13:10", "16:40"]},
    {"id": 11, "name": "Dr. Banerjee", "specialty": "Endocrinology", "available_slots": ["09:50", "12:40", "15:20"]},
    {"id": 12, "name": "Dr. Verma", "specialty": "Gastroenterology", "available_slots": ["10:00", "13:30", "16:00"]},
    {"id": 13, "name": "Dr. Reddy", "specialty": "Urology", "available_slots": ["09:25", "12:00", "15:50"]},
    {"id": 14, "name": "Dr. Pillai", "specialty": "Nephrology", "available_slots": ["10:10", "13:50", "17:10"]},
]

DOCTOR_RATINGS: Dict[int, List[int]] = {}  # doctor_id -> list of ratings
MEDICINE_SALES = []
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
    appointment_id: int
    symptoms: List[str]
    
class BuyPrescriptionRequest(BaseModel):
    appointment_id: int

class RatingRequest(BaseModel):
    user_id: int
    rating: int  # 1-5

class RescheduleRequest(BaseModel):
    new_time_slot: str
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
                print("Time before syncing:",t1,"\nTime after syncing:",logical_clock)
        except:
            pass
    threading.Thread(target=_sync, daemon=True).start()

def is_node_alive(port):
    """Check if a node is alive using its health endpoint."""
    try:
        res = requests.get(f"http://127.0.0.1:{port}/health", timeout=REQ_TIMEOUT)
        return res.status_code == 200
    except:
        return False

def push_full_state_to_replicas():
    """Coordinator pushes full application state to only live replicas."""
    global OTHER_PORTS   # So we can update the list by removing dead nodes

    snapshot = {
        "medicines": MEDICINES,
        "users": USERS,
        "appointments": APPOINTMENTS,
        "doctor_ratings": DOCTOR_RATINGS,
        "medicine_sales": MEDICINE_SALES
    }

    def _push():
        global OTHER_PORTS
        alive_ports = []
        for p in OTHER_PORTS:
            if is_node_alive(p):
                try:
                    requests.post(
                        f"http://127.0.0.1:{p}/push_state",
                        json=snapshot,
                        timeout=REQ_TIMEOUT
                    )
                    print(f"[Server {PORT}] ✅ State pushed to {p}")
                    alive_ports.append(p)
                except Exception as e:
                    print(f"[Server {PORT}] ⚠️ Node {p} alive but failed to push state: {e}")
            else:
                print(f"[Server {PORT}] ❌ Node {p} is DOWN, skipping...")
        
        # Update OTHER_PORTS to only include alive replicas
        OTHER_PORTS = alive_ports

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
    global MEDICINES, USERS, APPOINTMENTS, DOCTOR_RATINGS, MEDICINE_SALES
    meds = payload.get("medicines")
    users = payload.get("users")
    apps = payload.get("appointments")
    doctor_ratings = payload.get("doctor_ratings")
    medicine_sales = payload.get("medicine_sales")
    if not isinstance(meds, list) or not isinstance(users, list) or not isinstance(apps, list) or not isinstance(doctor_ratings, dict) or not isinstance(medicine_sales, list):
        raise HTTPException(status_code=400, detail="invalid state payload")
    with lock:
        MEDICINES = [m.copy() for m in meds]
        USERS = [u.copy() for u in users]
        APPOINTMENTS = [a.copy() for a in apps]
        DOCTOR_RATINGS = {int(k): v.copy() for k, v in doctor_ratings.items()}
        MEDICINE_SALES =  [mr.copy() for mr in medicine_sales]
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

@app.get("/users/{user_id}/appointments")
def list_appointments(user_id: int):
    async_clock_sync()
    with lock:
        user_appts = [a for a in APPOINTMENTS if a["user_id"] == user_id]
    return {"appointments": user_appts}

@app.get("/users/{user_id}/prescriptions")
def list_prescriptions(user_id: int):
    with lock:
        user_appts = [a for a in APPOINTMENTS if a["user_id"] == user_id and a.get("prescription")]
        prescriptions = [{"appointment_id": a["id"], "prescription": a["prescription"]} for a in user_appts]
    return {"prescriptions": prescriptions}

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

@app.post("/ratings/{doctor_id}")
def rate_doctor(doctor_id: int, req: RatingRequest):
    # writes go through coordinator
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/ratings/{doctor_id}", json=req.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except Exception:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable; try again")
    # coordinator rates
    with lock:
        if doctor_id not in DOCTOR_RATINGS:
            DOCTOR_RATINGS[doctor_id] = []
        DOCTOR_RATINGS[doctor_id].append(req.rating)
    print(f"[Server {PORT}] User {req.user_id} gave a rating of {req.rating} to Doctor {doctor_id}")
    push_full_state_to_replicas()
    return {"status": "SUCCESS"}

@app.get("/ratings/{doctor_id}")
def get_doctor_rating(doctor_id: int):
    with lock:
        ratings = DOCTOR_RATINGS.get(doctor_id, [])
        avg = sum(ratings)/len(ratings) if ratings else None
    return {"average_rating": avg, "num_ratings": len(ratings)}
        
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

@app.delete("/appointments/{appointment_id}")
def cancel_appointment(appointment_id: int):
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.delete(f"http://127.0.0.1:{current_coord}/appointments/{appointment_id}", timeout=REQ_TIMEOUT)
            return r.json()
        except:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable")
    with lock:
        idx = next((i for i, a in enumerate(APPOINTMENTS) if a["id"] == appointment_id), None)
        if idx is None:
            raise HTTPException(status_code=404, detail="Appointment not found")
        APPOINTMENTS.pop(idx)
    push_full_state_to_replicas()
    return {"status": "SUCCESS", "message": "Appointment canceled"}

@app.post("/appointments/{appointment_id}/reschedule")
def reschedule_appointment(appointment_id: int, req: RescheduleRequest):
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/appointments/{appointment_id}/reschedule", json=req.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable")
    with lock:
        appt = next((a for a in APPOINTMENTS if a["id"] == appointment_id), None)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
        # check doctor availability
        doc = next((d for d in DOCTORS if d["id"] == appt["doctor_id"]), None)
        if req.new_time_slot not in doc["available_slots"] or req.new_time_slot in [a["time_slot"] for a in APPOINTMENTS if a["doctor_id"] == doc["id"]]:
            return {"status": "FAILED", "message": "Time slot not available"}
        appt["time_slot"] = req.new_time_slot
    push_full_state_to_replicas()
    return {"status": "SUCCESS", "new_time_slot": req.new_time_slot}

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
    print(f"[Server {PORT}] Consulting for symptoms: {symptom_text}")
    symptom_text = symptom_text.lower()
    if "fever" in symptom_text or "temperature" in symptom_text:
        disease = "Fever"
        prescription = [{"medicine_id": 0, "quantity": 2}]  # Paracetamol

    elif "cough" in symptom_text or "cold" in symptom_text or "sneeze" in symptom_text:
        disease = "Common Cold"
        prescription = [{"medicine_id": 0, "quantity": 1}]  # Paracetamol
        if len(MEDICINES) > 3:
            prescription.append({"medicine_id": 3, "quantity": 1})  # Cough Syrup

    elif "headache" in symptom_text or "migraine" in symptom_text or "pain" in symptom_text:
        disease = "Headache/Pain"
        prescription = [{"medicine_id": 1, "quantity": 2}]  # Ibuprofen

    elif "sore throat" in symptom_text or "throat" in symptom_text or "infection" in symptom_text:
        disease = "Throat Infection"
        prescription = [{"medicine_id": 2, "quantity": 1}]  # Amoxicillin

    elif "acidity" in symptom_text or "heartburn" in symptom_text or "stomach pain" in symptom_text:
        disease = "Acidity"
        prescription = [{"medicine_id": 4, "quantity": 1}]  # Antacid

    elif "allergy" in symptom_text or "itching" in symptom_text or "rash" in symptom_text:
        disease = "Allergy"
        prescription = [{"medicine_id": 5, "quantity": 1}]  # Cetirizine

    elif "sugar" in symptom_text or "diabetes" in symptom_text or "high glucose" in symptom_text:
        disease = "Diabetes"
        prescription = [{"medicine_id": 6, "quantity": 1}]  # Metformin

    elif "chest pain" in symptom_text or "blood pressure" in symptom_text or "bp" in symptom_text:
        disease = "Hypertension"
        prescription = [{"medicine_id": 17, "quantity": 1}]  # Losartan

    elif "bone pain" in symptom_text or "weakness" in symptom_text or "vitamin" in symptom_text:
        disease = "Vitamin Deficiency"
        prescription = [{"medicine_id": 9, "quantity": 1}]  # Vitamin D3

    elif "infection" in symptom_text or "bacteria" in symptom_text or "antibiotic" in symptom_text:
        disease = "Bacterial Infection"
        prescription = [{"medicine_id": 12, "quantity": 1}]  # Ciprofloxacin

    elif "asthma" in symptom_text or "breath" in symptom_text or "respiratory" in symptom_text:
        disease = "Respiratory Illness"
        prescription = [{"medicine_id": 3, "quantity": 1}, {"medicine_id": 5, "quantity": 1}]  # Cough Syrup + Antihistamine

    elif "stomach" in symptom_text or "diarrhea" in symptom_text or "loose motion" in symptom_text:
        disease = "Gastrointestinal Infection"
        prescription = [{"medicine_id": 12, "quantity": 1}]  # Ciprofloxacin

    elif "joint pain" in symptom_text or "arthritis" in symptom_text:
        disease = "Arthritis"
        prescription = [{"medicine_id": 1, "quantity": 2}, {"medicine_id": 15, "quantity": 1}]  # Ibuprofen + Hydroxychloroquine

    else:
        disease = "General Checkup"
        prescription = [{"medicine_id": 10 if len(MEDICINES)>10 else 0, "quantity": 1}]  # Multivitamin or fallback Paracetamol


    # store into latest appointment if exists
    with lock:
        # find latest appointment for this user and doctor without prescription yet
        appt = next((a for a in APPOINTMENTS if a["id"] == req.appointment_id), None)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
        user_id = appt["user_id"]
        doctor_id = appt["doctor_id"]
        # store symptoms and prescription
        appt["symptoms"] = req.symptoms
        appt["prescription"] = prescription
    print(f"[Server {PORT}] Consult done for user {user_id}. Diagnosis: {disease}. Prescription: {prescription}")
    push_full_state_to_replicas()
    # respond with diagnosis & prescription
    return {"diagnosis": disease, "prescription": prescription}

# ---------- Pharmacy endpoints (reads/writes) ----------
@app.get("/medicines")
def get_medicines(appointment_id: Optional[int] = Query(None)):
    ensure_coordinator_alive_check()
    async_clock_sync()
    with lock:
        if appointment_id is None:
            return {"medicines": MEDICINES}
        # find appointment
        appt = next((a for a in APPOINTMENTS if a["id"] == appointment_id), None)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
        prescription = appt.get("prescription", [])
        if not prescription:
            return {"medicines": []}
        # return detailed medicine info
        meds = []
        for item in prescription:
            med_id = item["medicine_id"]
            if med_id < 0 or med_id >= len(MEDICINES):
                continue
            med_info = MEDICINES[med_id].copy()
            med_info["quantity"] = item["quantity"]
            meds.append(med_info)
        return {"medicines": meds}
@app.get("/medicines/search")
def search_medicines(name: str = Query(...)):
    with lock:
        results = [m for m in MEDICINES if name.lower() in m["name"].lower()]
    return {"results": results}

@app.post("/medicines/{medicine_id}/restock")
def restock_medicine(medicine_id: int, quantity: int = Query(...)):
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/medicines/{medicine_id}/restock?quantity={quantity}", timeout=REQ_TIMEOUT)
            return r.json()
        except:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable")
    with lock:
        if medicine_id < 0 or medicine_id >= len(MEDICINES):
            raise HTTPException(status_code=404, detail="Medicine not found")
        MEDICINES[medicine_id]["stock"] += quantity
    push_full_state_to_replicas()
    return {"status": "SUCCESS", "new_stock": MEDICINES[medicine_id]["stock"]}

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
        MEDICINE_SALES.append({
            "medicine_id": request.medicine_id,
            "sold_qty": request.quantity,
            "price": med["price"]
        })

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
            MEDICINE_SALES.append({
                "medicine_id": it.medicine_id,
                "sold_qty": it.quantity,
                "price": MEDICINES[it.medicine_id]["price"]
            })

            total_cost += MEDICINES[it.medicine_id].get("price", 0) * it.quantity
        snapshot = [m.copy() for m in MEDICINES]
    print(f"[Server {PORT}] (COORDINATOR) User {request.user_id} bought items {request.items}")
    push_full_state_to_replicas()
    async_clock_sync()
    return {"status": "SUCCESS", "total_cost": total_cost}

@app.post("/buy_prescription")
def buy_prescription(req: BuyPrescriptionRequest):
    current_coord = ensure_coordinator_alive_check()
    if current_coord != PORT:
        try:
            r = requests.post(f"http://127.0.0.1:{current_coord}/buy_prescription", json=req.dict(), timeout=REQ_TIMEOUT)
            return r.json()
        except Exception:
            elect_coordinator()
            if coordinator_port != PORT:
                raise HTTPException(status_code=503, detail="Coordinator unreachable; try again")

    with lock:
        # find appointment
        appt = next((a for a in APPOINTMENTS if a["id"] == req.appointment_id), None)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")

        prescription = appt.get("prescription", [])
        if not prescription:
            return {"status": "FAILED", "message": "No prescription found for this appointment"}

        # check stock for all items
        for item in prescription:
            med_id = item["medicine_id"]
            qty = item["quantity"]
            if med_id < 0 or med_id >= len(MEDICINES):
                raise HTTPException(status_code=404, detail=f"Medicine id {med_id} not found")
            if MEDICINES[med_id]["stock"] < qty:
                return {"status": "FAILED", "message": f"Not enough stock of {MEDICINES[med_id]['name']}"}

        # decrement stock and calculate total cost
        total_cost = 0
        for item in prescription:
            med_id = item["medicine_id"]
            qty = item["quantity"]
            MEDICINES[med_id]["stock"] -= qty
            MEDICINE_SALES.append({
                "medicine_id": med_id,
                "sold_qty": qty,
                "price": MEDICINES[med_id]["price"]
            })

            total_cost += MEDICINES[med_id]["price"] * qty

    print(f"[Server {PORT}] (COORDINATOR) User {appt['user_id']} bought prescription for appointment {req.appointment_id}")
    push_full_state_to_replicas()
    async_clock_sync()
    return {"status": "SUCCESS", "total_cost": total_cost, "prescription": prescription}

@app.get("/reports/sales")
def sales_report():
    with lock:
        print("\n[MAP REDUCE] Generating Sales Report\n")
        # --- Map stage ---
        mapped = []
        for x in MEDICINE_SALES:
            name = MEDICINES[x["medicine_id"]]["name"]
            revenue = x["sold_qty"] * x["price"]
            mapped.append((name, revenue))
            print(f"[MAP] {x} -> ({name}, {revenue})")
        
        # --- Shuffle / group stage ---
        grouped = defaultdict(list)
        for key, value in mapped:
            grouped[key].append(value)
        print("\n[SHUFFLE / GROUP] Grouped by medicine:")
        for k, v in grouped.items():
            print(f"{k}: {v}")
        
        # --- Reduce stage ---
        reduced = []
        print("\n[REDUCE] Summing revenues per medicine:")
        for k, v in grouped.items():
            total = sum(v)
            reduced.append((k, total))
            print(f"{k}: {total}")
        
        total_revenue = sum(amount for _, amount in reduced)
        print(f"\n[TOTAL REVENUE] {total_revenue}\n")

    return {"medicine_sales": reduced, "total_revenue": total_revenue}
# ---------- Run ----------
if __name__ == "__main__":
    print(f"Starting server on port {PORT}. Initial coordinator: {coordinator_port}")
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=PORT)