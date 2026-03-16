import { getFirestore, doc, setDoc, onSnapshot, getDoc, runTransaction } from "firebase/firestore"
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
        return onSnapshot(doc(db, collectionName, GLOBAL_DOC_ID), snapshot => {
            const data = snapshot.data() || {}
            callback(new Dispatch(data.centrale, data.patates, data.hospitalStatus, data.interventions, data.lsesRadio, data.communeRadio, data.notepad, data.radios, data.nuitRadioId, data.crises, data.beds, data.temporaryEmployees, data.morgue, data.crisisZip))
        })
    }

    async save() {
        await setDoc(doc(db, collectionName, GLOBAL_DOC_ID), {
            centrale: this.centrale,
            patates: this.patates,
            hospitalStatus: this.hospitalStatus || 'gestion_normale',
            interventions: this.interventions || [],
            lsesRadio: this.lsesRadio || '',
            communeRadio: this.communeRadio || '',
            notepad: this.notepad || '',
            radios: this.radios || [],
            nuitRadioId: this.nuitRadioId || null,
            crises: this.crises || [],
            beds: this.beds || {},
            temporaryEmployees: this.temporaryEmployees || [],
            morgue: this.morgue || { lockers: {}, urnShelves: {}, burials: {} },
            crisisZip: this.crisisZip || ''
        }, { merge: true })
    }

    static async updateField(field, value) {
        await setDoc(doc(db, collectionName, GLOBAL_DOC_ID), { [field]: value }, { merge: true })
    }

    static async updateCrisis(crisisId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const crises = snap.data().crises || []
            const idx = crises.findIndex(c => c.id === crisisId)
            if (idx !== -1) {
                crises[idx] = { ...crises[idx], ...updates }
                transaction.update(d, { crises })
            }
        })
    }

    static async updateIntervention(slotId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const interventions = snap.data().interventions || []
            const idx = interventions.findIndex(s => s.id === slotId)
            if (idx !== -1) {
                interventions[idx] = { ...interventions[idx], ...updates }
                transaction.update(d, { interventions })
            }
        })
    }

    static async updateRadio(radioId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const radios = snap.data().radios || []
            const idx = radios.findIndex(r => r.id === radioId)
            if (idx !== -1) {
                radios[idx] = { ...radios[idx], ...updates }
                transaction.update(d, { radios })
            }
        })
    }

    static async updateCentrale(updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const data = snap.data()
            const centrale = { ...(data.centrale || {}), ...updates }
            transaction.update(d, { centrale })
        })
    }

    static async updateBed(bedId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const beds = snap.data().beds || {}
            beds[bedId] = { ...(beds[bedId] || { patientName: '', fdoNotified: false, emergencyContactsNotified: false, reason: '', admissionTime: null }), ...updates }
            transaction.update(d, { beds })
        })
    }

    static async updateTemporaryEmployees(newList) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            transaction.update(d, { temporaryEmployees: newList })
        })
    }

    static async addTemporaryEmployee(empData) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const list = snap.data().temporaryEmployees || []
            list.push({
                ...empData,
                id: 'temp_' + Date.now() + Math.random().toString(36).slice(2, 6)
            })
            transaction.update(d, { temporaryEmployees: list })
        })
    }

    static async updateTemporaryEmployee(empId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const list = snap.data().temporaryEmployees || []
            const idx = list.findIndex(e => e.id === empId)
            if (idx !== -1) {
                list[idx] = { ...list[idx], ...updates }
                transaction.update(d, { temporaryEmployees: list })

                const data = snap.data()
                const patates = data.patates || []
                const interventions = data.interventions || []
                const centrale = data.centrale || { employees: [] }

                patates.forEach(p => { if (p.employeeId === empId) Object.assign(p, updates) })
                interventions.forEach(s => {
                    (s.employees || []).forEach(e => { if (e.employeeId === empId) Object.assign(e, updates) })
                })
                centrale.employees.forEach(e => { if (e.employeeId === empId) Object.assign(e, updates) })

                transaction.update(d, { patates, interventions, centrale })
            }
        })
    }

    static async removeTemporaryEmployee(empId) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
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

            transaction.update(d, { temporaryEmployees, patates, interventions, centrale })
        })
    }

    static async updateMorgue(section, slotKey, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const morgue = snap.data().morgue || { lockers: {}, urnShelves: {}, burials: {} }
            if (!morgue[section]) morgue[section] = {}
            morgue[section][slotKey] = { ...(morgue[section][slotKey] || {}), ...updates }
            transaction.update(d, { morgue })
        })
    }

    static async resetAll() {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const data = snap.data()
            const patates = []
            const centrale = { ...(data.centrale || {}), employees: [] }
            const interventions = (data.interventions || []).map(slot => ({ ...slot, employees: [] }))
            const radios = (data.radios || []).map(radio => ({ ...radio, status: 'off' }))
            transaction.update(d, { patates, centrale, interventions, radios })
        })
    }

    static async migrateEmployee(employeeId, srcKey, targetKey, employeeData) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const data = snap.data()
            const patates = data.patates || []
            const interventions = data.interventions || []
            const centrale = data.centrale || { employees: [] }

            if (srcKey === 'centrale') {
                centrale.employees = (centrale.employees || []).filter(e => e.employeeId !== employeeId)
            } else if (srcKey?.startsWith('inter:')) {
                const slotId = srcKey.slice(6)
                const slot = interventions.find(s => s.id === slotId)
                if (slot) slot.employees = (slot.employees || []).filter(e => e.employeeId !== employeeId)
            } else if (srcKey?.startsWith('cat:')) {
                const idx = patates.findIndex(p => p.employeeId === employeeId)
                if (idx !== -1) patates.splice(idx, 1)
            }

            if (targetKey === 'centrale') {
                if (!centrale.employees.find(e => e.employeeId === employeeId)) {
                    centrale.employees.push({ ...employeeData, employeeId, centralRole: null })
                }
            } else if (targetKey?.startsWith('inter:')) {
                const slotId = targetKey.slice(6)
                const slot = interventions.find(s => s.id === slotId)
                if (slot) {
                    if (!slot.employees) slot.employees = []
                    if (!slot.employees.find(e => e.employeeId === employeeId)) {
                        slot.employees.push({ ...employeeData, employeeId })
                    }
                }
            } else if (targetKey?.startsWith('cat:')) {
                const category = targetKey.slice(4)
                patates.push({
                    ...employeeData,
                    employeeId,
                    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
                    category
                })
            }

            transaction.update(d, { patates, interventions, centrale })
        })
    }
    static async deleteInterventionSlot(slotId, returnEmployees = true) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const data = snap.data()
            const interventions = data.interventions || []
            const patates = data.patates || []
            const slotIdx = interventions.findIndex(s => s.id === slotId)

            if (slotIdx !== -1) {
                const slot = interventions[slotIdx]
                if (returnEmployees && slot.employees?.length) {
                    slot.employees.forEach(emp => {
                        patates.push({
                            ...emp,
                            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
                            category: 'en_service'
                        })
                    })
                }
                interventions.splice(slotIdx, 1)
                transaction.update(d, { interventions, patates })
            }
        })
    }
    static async removeFromBoard(employeeId) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(d)
            if (!snap.exists()) return
            const data = snap.data()
            const patates = (data.patates || []).filter(p => p.employeeId !== employeeId)
            const interventions = (data.interventions || []).map(slot => ({
                ...slot,
                employees: (slot.employees || []).filter(e => e.employeeId !== employeeId)
            }))
            const centrale = {
                ...(data.centrale || {}),
                employees: (data.centrale?.employees || []).filter(e => e.employeeId !== employeeId)
            }
            transaction.update(d, { patates, interventions, centrale })
        })
    }
}

export default Dispatch

