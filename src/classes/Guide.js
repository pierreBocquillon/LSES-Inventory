

import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from "firebase/firestore"
const db = getFirestore()

const collectionName = "training_guides"

function docToInstance(document) {
    const data = document.data()
    return data ? new Guide(document.id, data.title, data.description, data.steps) : null
}

class Guide {
    constructor(id, title, description, steps) {
        this.id = id
        this.title = title
        this.description = description
        this.steps = steps || []
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

    static async get(id) {
        const ref = doc(db, collectionName, id)
        const snap = await getDoc(ref)
        if (snap.exists()) {
            return docToInstance(snap)
        }
        return null
    }

    async save() {
        const new_doc = {
            title: this.title,
            description: this.description,
            steps: this.steps
        }
        await setDoc(doc(db, collectionName, this.id), new_doc)
    }

    async delete() {
        await deleteDoc(doc(db, collectionName, this.id))
    }
}

export default Guide
