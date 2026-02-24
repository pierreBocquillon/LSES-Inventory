import { getFirestore, doc, collection, addDoc, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore"
let db = getFirestore()

let collectionName = "specialties"

function docToInstance(document) {
    let data = document.data()
    return data ? new Specialty(document.id, data.name, data.icon, data.value, data.canTakeAppointments) : null
}

class Specialty {
    constructor(id, name, icon, value, canTakeAppointments) {
        this.id = id
        this.name = name
        this.icon = icon
        this.value = value
        this.canTakeAppointments = canTakeAppointments || false
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
            name: this.name,
            icon: this.icon,
            value: this.value,
            canTakeAppointments: this.canTakeAppointments || false
        }

        if (this.id) {
            await updateDoc(doc(db, collectionName, this.id), new_doc)
        } else {
            // Auto-generate value if not present
            if (!this.value) {
                this.value = this.name.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                    .replace(/[^a-z0-9]+/g, '_') // replace non-alphanumeric with underscore
                    .replace(/^_|_$/g, '') // remove leading/trailing underscores
            }
            new_doc.value = this.value

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

export default Specialty
