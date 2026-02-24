import { getFirestore, doc, collection, onSnapshot, addDoc, setDoc, deleteDoc } from "firebase/firestore"
let db = getFirestore()

let collectionName = "appointments"

function docToInstance(document) {
    let data = document.data()
    return data ? new Appointment(
        document.id,
        data.patientName,
        data.patientPhone,
        data.specialty,
        data.date,
        data.time,
        data.duration,
        data.reason,
        data.status,
        data.doctor,
        data.companion,
        data.notes,
        data.createdAt,
        data.availability
    ) : null
}

class Appointment {
    constructor(id, patientName, patientPhone, specialty, date, time, duration, reason, status, doctor, companion, notes, createdAt, availability) {
        this.id = id
        this.patientName = patientName
        this.patientPhone = patientPhone
        this.specialty = specialty
        this.date = date
        this.time = time
        this.duration = duration || 30 // Default 30 minutes
        this.reason = reason
        this.status = status || 'En attente'
        this.doctor = doctor || ''
        this.companion = companion || ''
        this.notes = notes || ''
        this.createdAt = createdAt || Date.now()
        this.availability = availability || ''
    }

    static listenAll(callback) {
        return onSnapshot(collection(db, collectionName), snapshot => {
            const list = []
            snapshot.forEach(doc => {
                list.push(docToInstance(doc))
            })
            callback(list)
        })
    }

    async save() {
        const new_doc = {
            patientName: this.patientName,
            patientPhone: this.patientPhone,
            specialty: this.specialty,
            date: this.date,
            time: this.time,
            duration: this.duration,
            reason: this.reason,
            status: this.status,
            doctor: this.doctor,
            companion: this.companion,
            notes: this.notes,
            createdAt: this.createdAt,
            availability: this.availability
        }

        if (this.id) {
            await setDoc(doc(db, collectionName, this.id), new_doc, { merge: true })
        } else {
            const docRef = await addDoc(collection(db, collectionName), new_doc)
            this.id = docRef.id
        }
    }

    async delete() {
        if (this.id) {
            await deleteDoc(doc(db, collectionName, this.id))
        }
    }
}

export default Appointment
