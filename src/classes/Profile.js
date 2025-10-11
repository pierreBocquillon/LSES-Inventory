import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "profiles"

function docToInstance(document) {
  let data = document.data()
  return data ? new Profile(document.id, data.name, data.email, data.role, data.activated, data.rejected) : null
}

class Profile {
  constructor(id, name, email, role, activated, rejected) {
    this.id = id
    this.name = name
    this.email = email
    this.role = role
    this.activated = activated
    this.rejected = rejected
  }

  static initOne(uid, name, email) {
    const newProfile = new Profile(uid, name, email, "User", false, false)
    return newProfile
  }

  static async getAll() {
    const documents = await getDocs(collection(db, collectionName))
    return documents.docs.map(docToInstance)
  }

  static async getById(id) {
    const document = await getDoc(doc(db, collectionName, id))
    return docToInstance(document)
  }

  static async getByName(name) {
    const q = query(collection(db, collectionName), where("name", "==", name))
    const documents = await getDocs(q)
    return documents.docs.map(docToInstance)
  }

  static async getByEmail(email) {
    const q = query(collection(db, collectionName), where("email", "==", email))
    const documents = await getDocs(q)
    return documents.docs.map(docToInstance)
  }

  static async getByActivated(activated) {
    const q = query(collection(db, collectionName), where("activated", "==", activated))
    const documents = await getDocs(q)
    return documents.docs.map(docToInstance)
  }

  static async listenAll(callback) {
    onSnapshot(collection(db, collectionName), snapshot => {
      const list = []
      snapshot.forEach(doc => {
        list.push(docToInstance(doc))
      })
      callback(list)
    })
  }

  static async listenById(id, callback) {
    onSnapshot(doc(db, collectionName, id), snapshot => {
      callback(docToInstance(snapshot))
    })
  }

  static async listenByName(name, callback) {
    const q = query(collection(db, collectionName), where("name", "==", name))
    onSnapshot(q, snapshot => {
      const list = []
      snapshot.forEach(doc => {
        list.push(docToInstance(doc))
      })
      callback(list)
    })
  }

  static async listenByEmail(email, callback) {
    const q = query(collection(db, collectionName), where("email", "==", email))
    onSnapshot(q, snapshot => {
      const list = []
      snapshot.forEach(doc => {
        list.push(docToInstance(doc))
      })
      callback(list)
    })
  }

  static async listenByActivated(activated, callback) {
    const q = query(collection(db, collectionName), where("activated", "==", activated))
    onSnapshot(q, snapshot => {
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
      email: this.email,
      role: this.role,
      activated: this.activated,
      rejected: this.rejected
    }

    if (this.id) {
      await setDoc(doc(db, collectionName, this.id), new_doc)
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

export default Profile