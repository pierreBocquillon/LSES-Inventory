import { getFirestore, doc, collection, addDoc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore"
let db = getFirestore()

let collectionName = "candidatures"

function docToInstance(document) {
    let data = document.data()

    return data ? new Candidature(document.id, data.name, data.phone, data.email, data.availabilities) : null
}

class Candidature {
    constructor(id, name, phone, email, availabilities, status, votes, answers) {
        this.id = id
        this.name = name
        this.phone = phone
        this.email = email
        this.availabilities = availabilities
        this.status = status || 'Candidature reçue'
        this.votes = votes || {}
        this.answers = answers || {}
    }

    static listenAll(callback) {
        return onSnapshot(collection(db, collectionName), snapshot => {
            const list = []
            snapshot.forEach(doc => {
                const data = doc.data()
                list.push(new Candidature(doc.id, data.name, data.phone, data.email, data.availabilities, data.status, data.votes, data.answers))
            })
            callback(list)
        })
    }

    async save() {
        const new_doc = {
            name: this.name,
            phone: this.phone,
            email: this.email,
            availabilities: this.availabilities,
            status: this.status,
            votes: this.votes,
            answers: this.answers
        }

        if (this.id)
            await setDoc(doc(db, collectionName, this.id), new_doc)
        else {
            const docRef = await addDoc(collection(db, collectionName), new_doc)

            this.id = docRef.id
        }
    }

    async delete() {
        if (this.id)
            await deleteDoc(doc(db, collectionName, this.id))
    }
}

export default Candidature
