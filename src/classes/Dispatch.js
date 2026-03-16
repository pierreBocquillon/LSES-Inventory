import { getFirestore, doc, setDoc, onSnapshot, getDoc, runTransaction, collection, updateDoc, deleteDoc, addDoc, getDocs, writeBatch } from "firebase/firestore"
let db = getFirestore()

const GLOBAL_DOC_ID = "global"
const collectionName = "dispatches"

function normalizeCentrale(c) {
    if (!c) return { location: null, complement: null, type: null, returnStatus: null, employees: [] }
    if (c.employeeId)
        return { location: null, complement: null, type: null, returnStatus: null, employees: [{ employeeId: c.employeeId, name: c.name, phone: c.phone, allSpecialties: c.allSpecialties || [], centralRole: null }] }
    return { location: c.location || null, complement: c.complement || null, type: c.type || null, returnStatus: c.returnStatus || null, employees: c.employees || [] }
}

class Dispatch {
    constructor(centrale, patates, hospitalStatus, interventions, lsesRadio, communeRadio, notepad, radios, nuitRadioId, crises, beds, temporaryEmployees, morgue, crisisZip) {
        this.centrale = normalizeCentrale(centrale)
        this.patates = patates || []
        this.hospitalStatus = hospitalStatus || 'gestion_normale'
        this.interventions = interventions || []
        this.lsesRadio = lsesRadio || ''
        this.communeRadio = communeRadio || ''
        this.notepad = notepad || ''
        this.radios = radios || []
        this.nuitRadioId = nuitRadioId || null
        this.crises = crises || []
        this.beds = beds || {}
        this.temporaryEmployees = temporaryEmployees || []
        this.morgue = morgue || { lockers: {}, urnShelves: {}, burials: {} }
        this.crisisZip = crisisZip || ''
    }

    static listenGlobal(callback) {
        const globalRef = doc(db, collectionName, GLOBAL_DOC_ID)
        const crisesRef = collection(db, collectionName, GLOBAL_DOC_ID, "crises")
        const interventionsRef = collection(db, collectionName, GLOBAL_DOC_ID, "interventions")
        const patatesRef = collection(db, collectionName, GLOBAL_DOC_ID, "patates")

        let globalData = null
        let crisesData = []
        let interventionsData = []
        let patatesData = []

        const emit = () => {
            if (globalData) {
                callback(new Dispatch(
                    globalData.centrale,
                    patatesData,
                    globalData.hospitalStatus,
                    interventionsData,
                    globalData.lsesRadio,
                    globalData.communeRadio,
                    globalData.notepad,
                    globalData.radios,
                    globalData.nuitRadioId,
                    crisesData,
                    globalData.beds,
                    globalData.temporaryEmployees,
                    globalData.morgue,
                    globalData.crisisZip
                ))
            }
        }

        const unsubGlobal = onSnapshot(globalRef, snapshot => {
            globalData = snapshot.data() || {}
            emit()
        })

        const unsubCrises = onSnapshot(crisesRef, snapshot => {
            crisesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            emit()
        })

        const unsubInterventions = onSnapshot(interventionsRef, snapshot => {
            interventionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            emit()
        })

        const unsubPatates = onSnapshot(patatesRef, snapshot => {
            patatesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            emit()
        })

        return () => {
            unsubGlobal()
            unsubCrises()
            unsubInterventions()
            unsubPatates()
        }
    }

    async save() {
        await updateDoc(doc(db, collectionName, GLOBAL_DOC_ID), {
            centrale: this.centrale,
            hospitalStatus: this.hospitalStatus || 'gestion_normale',
            lsesRadio: this.lsesRadio || '',
            communeRadio: this.communeRadio || '',
            notepad: this.notepad || '',
            radios: this.radios || [],
            nuitRadioId: this.nuitRadioId || null,
            beds: this.beds || {},
            temporaryEmployees: this.temporaryEmployees || [],
            morgue: this.morgue || { lockers: {}, urnShelves: {}, burials: {} },
            crisisZip: this.crisisZip || ''
        })
    }

    static async updateField(field, value) {
        await updateDoc(doc(db, collectionName, GLOBAL_DOC_ID), { [field]: value })
    }

    static async updateCrisis(crisisId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID, "crises", crisisId)
        await updateDoc(d, updates)
    }

    static async addCrisis(crisisData) {
        const c = collection(db, collectionName, GLOBAL_DOC_ID, "crises")
        await addDoc(c, crisisData)
    }

    static async removeCrisis(crisisId) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID, "crises", crisisId)
        await deleteDoc(d)
    }

    static async clearAllCrises() {
        const c = collection(db, collectionName, GLOBAL_DOC_ID, "crises")
        const snap = await getDocs(c)
        const batch = writeBatch(db)
        snap.docs.forEach(d => batch.delete(d.ref))
        await batch.commit()
    }

    static async updateIntervention(slotId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID, "interventions", slotId)
        await updateDoc(d, updates)
    }

    static async addInterventionSlot(slotData) {
        const c = collection(db, collectionName, GLOBAL_DOC_ID, "interventions")
        await addDoc(c, slotData)
    }

    static async updateRadio(radioId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const snap = await getDoc(d)
        if (!snap.exists()) return
        const radios = snap.data().radios || []
        const idx = radios.findIndex(r => r.id === radioId)
        if (idx !== -1) {
            radios[idx] = { ...radios[idx], ...updates }
            await updateDoc(d, { radios })
        }
    }

    static async updateCentrale(updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const up = {}
        Object.keys(updates).forEach(k => { up[`centrale.${k}`] = updates[k] })
        await updateDoc(d, up)
    }

    static async updateBed(bedId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const up = {}
        Object.keys(updates).forEach(k => { up[`beds.${bedId}.${k}`] = updates[k] })
        await updateDoc(d, up)
    }

    static async updateTemporaryEmployee(empId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const snap = await getDoc(d)
        if (!snap.exists()) return
        const list = snap.data().temporaryEmployees || []
        const idx = list.findIndex(e => e.id === empId)
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates }
            await updateDoc(d, { temporaryEmployees: list })
        }
    }

    static async removeTemporaryEmployee(empId) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const snap = await getDoc(d)
        if (!snap.exists()) return
        const data = snap.data()

        const temporaryEmployees = (data.temporaryEmployees || []).filter(e => e.id !== empId)
        const patates = (data.patates || []).filter(p => p.employeeId !== empId)
        const interventions = (data.interventions || []).map(slot => ({
            ...slot,
            employees: (slot.employees || []).filter(e => e.employeeId !== empId)
        }))
        const centrale = {
            ...(data.centrale || {}),
            employees: (data.centrale?.employees || []).filter(e => e.employeeId !== empId)
        }

        await updateDoc(d, { temporaryEmployees, patates, interventions, centrale })
    }

    static async updateMorgue(section, slotKey, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const up = {}
        Object.keys(updates).forEach(k => { up[`morgue.${section}.${slotKey}.${k}`] = updates[k] })
        await updateDoc(d, up)
    }

    static async resetAll() {
        const batch = writeBatch(db)
        const globalRef = doc(db, collectionName, GLOBAL_DOC_ID)

        const snap = await getDoc(globalRef)
        const data = snap.data() || {}

        const centrale = { ...(data.centrale || {}), employees: [] }
        const radios = (data.radios || []).map(radio => ({ ...radio, status: 'off' }))
        const patates = []
        const interventions = (data.interventions || []).map(slot => ({ ...slot, employees: [] }))

        batch.update(globalRef, { centrale, radios, patates, interventions })

        await batch.commit()
    }

    static async migrateEmployee(employeeId, srcKey, targetKey, employeeData) {
        const batch = writeBatch(db)
        const globalRef = doc(db, collectionName, GLOBAL_DOC_ID)
        const snap = await getDoc(globalRef)
        const data = snap.data() || {}

        let currentCentraleEmployees = data.centrale?.employees || []
        let currentPatates = data.patates || []
        let currentInterventions = data.interventions || []

        if (srcKey === 'centrale') {
            const snap = await getDoc(globalRef)
            const emps = (snap.data()?.centrale?.employees || []).filter(e => e.employeeId !== employeeId)
            batch.update(globalRef, { 'centrale.employees': emps })
        } else if (srcKey?.startsWith('inter:')) {
            const slotId = srcKey.slice(6)
            const d = doc(db, collectionName, GLOBAL_DOC_ID, "interventions", slotId)
            const snap = await getDoc(d)
            const emps = (snap.data()?.employees || []).filter(e => e.employeeId !== employeeId)
            batch.update(d, { employees: emps })
        } else if (srcKey?.startsWith('cat:')) {
            const c = collection(db, collectionName, GLOBAL_DOC_ID, "patates")
            const snap = await getDocs(c)
            const pDoc = snap.docs.find(d => d.data().employeeId === employeeId)
            if (pDoc) batch.delete(pDoc.ref)
        }

        if (targetKey === 'centrale') {
            const snap = await getDoc(globalRef)
            const emps = snap.data()?.centrale?.employees || []
            if (!emps.find(e => e.employeeId === employeeId)) {
                emps.push({ ...employeeData, employeeId, centralRole: null })
                batch.update(globalRef, { 'centrale.employees': emps })
            }
        } else if (targetKey?.startsWith('inter:')) {
            const slotId = targetKey.slice(6)
            const d = doc(db, collectionName, GLOBAL_DOC_ID, "interventions", slotId)
            const snap = await getDoc(d)
            if (snap.exists()) {
                const emps = snap.data().employees || []
                if (!emps.find(e => e.employeeId === employeeId)) {
                    emps.push({ ...employeeData, employeeId })
                    batch.update(d, { employees: emps })
                }
            }
        } else if (targetKey?.startsWith('cat:')) {
            const category = targetKey.slice(4)
            const c = collection(db, collectionName, GLOBAL_DOC_ID, "patates")
            const newRef = doc(c)
            batch.set(newRef, {
                ...employeeData,
                employeeId,
                category
            })
        }

        await batch.commit()
    }
    static async deleteInterventionSlot(slotId) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID, "interventions", slotId)
        const snap = await getDoc(d)
        if (!snap.exists()) return

        const batch = writeBatch(db)
        const employees = snap.data().employees || []

        if (employees.length) {
            const patRef = collection(db, collectionName, GLOBAL_DOC_ID, "patates")
            employees.forEach(emp => {
                const nr = doc(patRef)
                batch.set(nr, { ...emp, category: 'en_service' })
            })
        }
        batch.delete(d)
        await batch.commit()
    }
    static async removeFromBoard(employeeId) {
        const batch = writeBatch(db)
        const globalRef = doc(db, collectionName, GLOBAL_DOC_ID)

        const gSnap = await getDoc(globalRef)
        const cEmps = (gSnap.data()?.centrale?.employees || []).filter(e => e.employeeId !== employeeId)
        batch.update(globalRef, { 'centrale.employees': cEmps })

        const pSnap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, "patates"))
        pSnap.docs.forEach(d => {
            if (d.data().employeeId === employeeId) batch.delete(d.ref)
        })

        const iSnap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, "interventions"))
        iSnap.docs.forEach(d => {
            const emps = (d.data().employees || []).filter(e => e.employeeId !== employeeId)
            batch.update(d.ref, { employees: emps })
        })

        await batch.commit()
    }
}

export default Dispatch

