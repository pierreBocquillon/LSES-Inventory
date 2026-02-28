import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore"
let db = getFirestore()

const GLOBAL_DOC_ID = "global"
const collectionName = "dispatches"

function normalizeCentrale(c) {
    if (!c) return { location: null, type: null, employees: [] }
    if (c.employeeId)
        return { location: null, type: null, employees: [{ employeeId: c.employeeId, name: c.name, phone: c.phone, allSpecialties: c.allSpecialties || [], centralRole: null }] }
    return { location: c.location || null, type: c.type || null, employees: c.employees || [] }
}

class Dispatch {
    constructor(centrale, patates, hospitalStatus, interventions, lsesRadio, communeRadio, notepad) {
        this.centrale = normalizeCentrale(centrale)
        this.patates = patates || []
        this.hospitalStatus = hospitalStatus || 'gestion_normale'
        this.interventions = interventions || []
        this.lsesRadio = lsesRadio || ''
        this.communeRadio = communeRadio || ''
        this.notepad = notepad || ''
    }

    static listenGlobal(callback) {
        return onSnapshot(doc(db, collectionName, GLOBAL_DOC_ID), snapshot => {
            const data = snapshot.data() || {}
            callback(new Dispatch(data.centrale, data.patates, data.hospitalStatus, data.interventions, data.lsesRadio, data.communeRadio, data.notepad))
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
            notepad: this.notepad || ''
        }, { merge: true })
    }
}

export default Dispatch
