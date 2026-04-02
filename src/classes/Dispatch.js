import { getFirestore, doc, setDoc, onSnapshot, getDoc, runTransaction, collection, updateDoc, deleteDoc, addDoc, getDocs, writeBatch, query, orderBy } from "firebase/firestore"
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
    constructor(centrale, patates, hospitalStatus, interventions, lsesRadio, communeRadio, notepad, radios, nuitRadioId, crises, beds, temporaryEmployees, morgue, crisisZip, centralEmpsData, autoResetEnabled, autoResetTime, lastResetDate, nextResetCancelled) {
        this.centrale = normalizeCentrale(centrale)
        if (centralEmpsData) this.centrale.employees = centralEmpsData
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
        this.autoResetEnabled = autoResetEnabled || false
        this.autoResetTime = autoResetTime || '03:00'
        this.lastResetDate = lastResetDate || ''
        this.nextResetCancelled = nextResetCancelled || false
    }

    static listenGlobal(callback) {
        const globalRef = doc(db, collectionName, GLOBAL_DOC_ID)
        const crisesRef = collection(db, collectionName, GLOBAL_DOC_ID, "crises")
        const interventionsRef = collection(db, collectionName, GLOBAL_DOC_ID, "interventions")
        const patatesRef = collection(db, collectionName, GLOBAL_DOC_ID, "patates")
        const centralEmpsRef = collection(db, collectionName, GLOBAL_DOC_ID, "centrale_employees")

        let globalData = null
        let crisesData = []
        let interventionsData = []
        let patatesData = []
        let centralEmpsData = []

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
                    globalData.radios || [],
                    globalData.nuitRadioId,
                    crisesData,
                    globalData.beds,
                    globalData.temporaryEmployees,
                    globalData.morgue,
                    globalData.crisisZip,
                    centralEmpsData,
                    globalData.autoResetEnabled,
                    globalData.autoResetTime,
                    globalData.lastResetDate,
                    globalData.nextResetCancelled
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
            interventionsData.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
            emit()
        })

        const unsubPatates = onSnapshot(patatesRef, snapshot => {
            patatesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            emit()
        })

        const unsubCentralEmps = onSnapshot(centralEmpsRef, snapshot => {
            centralEmpsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            centralEmpsData.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
            emit()
        })

        return () => {
            unsubGlobal()
            unsubCrises()
            unsubInterventions()
            unsubPatates()
            unsubCentralEmps()
        }
    }

    async save() {
        await updateDoc(doc(db, collectionName, GLOBAL_DOC_ID), {
            centrale: {
                location: this.centrale.location || null,
                complement: this.centrale.complement || null,
                type: this.centrale.type || null,
                returnStatus: this.centrale.returnStatus || null,
            },
            hospitalStatus: this.hospitalStatus || 'gestion_normale',
            lsesRadio: this.lsesRadio || '',
            communeRadio: this.communeRadio || '',
            notepad: this.notepad || '',
            radios: this.radios || [],
            nuitRadioId: this.nuitRadioId || null,
            beds: this.beds || {},
            temporaryEmployees: this.temporaryEmployees || [],
            morgue: this.morgue || { lockers: {}, urnShelves: {}, burials: {} },
            crisisZip: this.crisisZip || '',
            autoResetEnabled: this.autoResetEnabled || false,
            autoResetTime: this.autoResetTime || '03:00',
            lastResetDate: this.lastResetDate || '',
            nextResetCancelled: this.nextResetCancelled || false
        })
    }

    static async updateField(field, value) {
        await updateDoc(doc(db, collectionName, GLOBAL_DOC_ID), { [field]: value })
    }
    static async updateFields(updates) {
        await updateDoc(doc(db, collectionName, GLOBAL_DOC_ID), updates)
    }

    static async updateRadio(radioId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const snap = await getDoc(d)
        if (!snap.exists()) return
        const list = snap.data().radios || []
        const idx = list.findIndex(r => r.id === radioId)
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates }
            await updateDoc(d, { radios: list })
        }
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
        await setDoc(d, updates, { merge: true })
    }

    static async addInterventionSlot(slotData) {
        const c = collection(db, collectionName, GLOBAL_DOC_ID, "interventions")
        const newRef = slotData.id ? doc(c, slotData.id) : doc(c)
        await setDoc(newRef, { ...slotData, id: newRef.id, createdAt: Date.now() })
        return newRef.id
    }

    static async updateCentraleEmployee(empId, updates) {
        const c = collection(db, collectionName, GLOBAL_DOC_ID, "centrale_employees")
        const snap = await getDocs(c)
        const d = snap.docs.find(doc => doc.data().employeeId === empId)
        if (d) await updateDoc(d.ref, updates)
    }

    static async updateCentrale(updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const up = {}
        Object.keys(updates).forEach(k => {
            if (k === 'employees') return
            up[`centrale.${k}`] = updates[k]
        })
        await updateDoc(d, up)

        if (updates.employees && updates.employees.length === 0) {
            const c = collection(db, collectionName, GLOBAL_DOC_ID, "centrale_employees")
            const snap = await getDocs(c)
            const batch = writeBatch(db)
            snap.docs.forEach(doc => batch.delete(doc.ref))
            await batch.commit()
        }
    }

    static async updateBed(bedId, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const up = {}
        Object.keys(updates).forEach(k => { up[`beds.${bedId}.${k}`] = updates[k] })
        await updateDoc(d, up)
    }

    static async addTemporaryEmployee(empData) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const snap = await getDoc(d)
        if (!snap.exists()) return
        const list = snap.data().temporaryEmployees || []
        const newEmp = {
            id: 'temp_' + Date.now().toString() + Math.random().toString(36).slice(2, 6),
            ...empData
        }
        list.push(newEmp)
        await setDoc(d, { temporaryEmployees: list }, { merge: true })
        return newEmp.id
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

        const batch = writeBatch(db)

        const temporaryEmployees = (data.temporaryEmployees || []).filter(e => e.id !== empId)
        batch.update(d, { temporaryEmployees })

        const pSnap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, "patates"))
        pSnap.docs.forEach(doc => { if (doc.data().employeeId === empId) batch.delete(doc.ref) })

        const iSnap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, "interventions"))
        iSnap.docs.forEach(doc => {
            const emps = (doc.data().employees || []).filter(e => e.employeeId !== empId)
            batch.update(doc.ref, { employees: emps })
        })

        const cSnap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, "centrale_employees"))
        cSnap.docs.forEach(doc => { if (doc.data().employeeId === empId) batch.delete(doc.ref) })

        await batch.commit()
    }

    static async updateMorgue(section, slotKey, updates) {
        const d = doc(db, collectionName, GLOBAL_DOC_ID)
        const up = {}
        Object.keys(updates).forEach(k => { up[`morgue.${section}.${slotKey}.${k}`] = updates[k] })
        await updateDoc(d, up)
    }

    static async resetAll(additionalUpdates = {}) {
        const batch = writeBatch(db)
        const globalRef = doc(db, collectionName, GLOBAL_DOC_ID)
        const snap = await getDoc(globalRef)
        const data = snap.data() || {}

        const radios = (data.radios || []).map(r => ({ ...r, status: 'off' }))

        batch.update(globalRef, {
            hospitalStatus: 'hopital_ferme',
            radios: radios,
            ...additionalUpdates
        })

        const colls = ["interventions", "patates", "centrale_employees"]
        for (const cName of colls) {
            const snap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, cName))
            snap.docs.forEach(d => batch.delete(d.ref))
        }

        await batch.commit()
    }

    static async tryAutoReset(currentDate) {
        const globalRef = doc(db, collectionName, GLOBAL_DOC_ID)
        let decision = null
        try {
            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(globalRef)
                if (!snap.exists()) return
                const data = snap.data()

                if (data.lastResetDate === currentDate) return

                decision = data.nextResetCancelled ? 'skipped' : 'reset'
                transaction.update(globalRef, { lastResetDate: currentDate })
            })

            if (!decision) return false

            if (decision === 'skipped') {
                await updateDoc(globalRef, { nextResetCancelled: false })
            } else {
                await Dispatch.resetAll({ nextResetCancelled: false, lastResetDate: currentDate })
            }
            return decision
        } catch (e) {
            console.error('AutoReset critical failure:', e)
            return false
        }
    }

    static async migrateEmployee(employeeId, srcKey, targetKey, employeeData) {
        await runTransaction(db, async (transaction) => {
            let srcSlotSnap = null
            let targetSlotSnap = null

            if (srcKey?.startsWith('inter:')) {
                srcSlotSnap = await transaction.get(doc(db, collectionName, GLOBAL_DOC_ID, "interventions", srcKey.slice(6)))
            }
            if (targetKey?.startsWith('inter:')) {
                if (srcKey === targetKey) {
                    targetSlotSnap = srcSlotSnap
                } else {
                    targetSlotSnap = await transaction.get(doc(db, collectionName, GLOBAL_DOC_ID, "interventions", targetKey.slice(6)))
                }
            }

            let oldCentraleDocRef = null
            if (srcKey === 'centrale') {
                const c = collection(db, collectionName, GLOBAL_DOC_ID, "centrale_employees")
                const snap = await getDocs(c)
                oldCentraleDocRef = snap.docs.find(doc => doc.data().employeeId === employeeId)?.ref || null
            }

            let oldPatateDocRef = null
            if (srcKey?.startsWith('cat:')) {
                const c = collection(db, collectionName, GLOBAL_DOC_ID, "patates")
                const snap = await getDocs(c)
                oldPatateDocRef = snap.docs.find(d => d.data().employeeId === employeeId)?.ref || null
            }

            if (srcKey === 'centrale') {
                if (oldCentraleDocRef) transaction.delete(oldCentraleDocRef)
                transaction.delete(doc(db, collectionName, GLOBAL_DOC_ID, "centrale_employees", employeeId))
            } else if (srcKey?.startsWith('inter:')) {
                if (srcSlotSnap?.exists()) {
                    const emps = (srcSlotSnap.data().employees || []).filter(e => e.employeeId !== employeeId)
                    transaction.update(srcSlotSnap.ref, { employees: emps })
                }
            } else if (srcKey?.startsWith('cat:')) {
                if (oldPatateDocRef) transaction.delete(oldPatateDocRef)
                transaction.delete(doc(db, collectionName, GLOBAL_DOC_ID, "patates", employeeId))
            }

            if (targetKey === 'centrale') {
                const d = doc(db, collectionName, GLOBAL_DOC_ID, "centrale_employees", employeeId)
                transaction.set(d, { ...employeeData, employeeId, centralRole: null, createdAt: employeeData.createdAt || Date.now() })
            } else if (targetKey?.startsWith('inter:')) {
                if (targetSlotSnap?.exists()) {
                    const emps = targetSlotSnap.data().employees || []
                    if (!emps.find(e => e.employeeId === employeeId)) {
                        emps.push({ ...employeeData, employeeId })
                        transaction.update(targetSlotSnap.ref, { employees: emps })
                    }
                }
            } else if (targetKey?.startsWith('cat:')) {
                const category = targetKey.slice(4)
                const d = doc(db, collectionName, GLOBAL_DOC_ID, "patates", employeeId)
                transaction.set(d, { ...employeeData, employeeId, category })
            }
        })
    }
    static async resetInterventionSlot(slotId) {
        await runTransaction(db, async (transaction) => {
            const d = doc(db, collectionName, GLOBAL_DOC_ID, "interventions", slotId)
            const snap = await transaction.get(d)
            if (!snap.exists()) return

            const employees = snap.data().employees || []
            if (employees.length) {
                const patRef = collection(db, collectionName, GLOBAL_DOC_ID, "patates")
                employees.forEach(emp => {
                    const empId = emp.employeeId || emp.id
                    if (empId) {
                        const nr = doc(patRef, empId)
                        transaction.set(nr, { ...emp, employeeId: empId, category: 'en_service' })
                    }
                })
            }

            transaction.update(d, {
                location: null,
                complement: null,
                type: 'intervention',
                returnStatus: null,
                employees: []
            })
        })
    }

    static async deleteInterventionSlot(slotId) {
        await runTransaction(db, async (transaction) => {
            const d = doc(db, collectionName, GLOBAL_DOC_ID, "interventions", slotId)
            const snap = await transaction.get(d)
            if (!snap.exists()) return

            const employees = snap.data().employees || []
            if (employees.length) {
                const patRef = collection(db, collectionName, GLOBAL_DOC_ID, "patates")
                employees.forEach(emp => {
                    const empId = emp.employeeId || emp.id
                    if (empId) {
                        const nr = doc(patRef, empId)
                        transaction.set(nr, { ...emp, employeeId: empId, category: 'en_service' })
                    }
                })
            }
            transaction.delete(d)
        })
    }

    static async removeFromBoard(employeeId) {
        await runTransaction(db, async (transaction) => {
            transaction.delete(doc(db, collectionName, GLOBAL_DOC_ID, "patates", employeeId))
            transaction.delete(doc(db, collectionName, GLOBAL_DOC_ID, "centrale_employees", employeeId))

            const colls = ["patates", "centrale_employees"]
            for (const cName of colls) {
                const snap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, cName))
                snap.docs.forEach(doc => { if (doc.data().employeeId === employeeId) transaction.delete(doc.ref) })
            }

            const iSnap = await getDocs(collection(db, collectionName, GLOBAL_DOC_ID, "interventions"))
            iSnap.docs.forEach(doc => {
                const emps = (doc.data().employees || []).filter(e => e.employeeId !== employeeId)
                transaction.update(doc.ref, { employees: emps })
            })
        })
    }
    static listenAffiliations(callback) {
        const c = collection(db, "affiliations")
        return onSnapshot(query(c, orderBy("order")), snapshot => {
            const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
            callback(list)
        })
    }
    static async addAffiliation(data) {
        const c = collection(db, "affiliations")
        await addDoc(c, data)
    }
    static async updateAffiliation(id, data) {
        const d = doc(db, "affiliations", id)
        await updateDoc(d, data)
    }
    static async deleteAffiliation(id) {
        const d = doc(db, "affiliations", id)
        await deleteDoc(d)
    }
}

export default Dispatch

