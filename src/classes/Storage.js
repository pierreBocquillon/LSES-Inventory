import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "storages"

function docToInstance(document) {
  let data = document.data()
  return data ? new Storage(document.id, data.icon, data.name, data.maxWeight) : null
}

class Storage {
  constructor(id, icon, name, maxWeight=0) {
    this.id = id
    this.icon = icon
    this.name = name
    this.maxWeight = maxWeight
  }

  static initOne(name="", icon="", maxWeight=0) {
    let id = Storage.createId(name)
    const newStorage = new Storage(id, icon, name, maxWeight)
    return newStorage
  }
  
  static createId(name) {
    let id = name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "-").toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "")
    return id
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

  async save() {
    const new_doc = {
      icon: this.icon,
      name: this.name,
      maxWeight: this.maxWeight,
    }

    if (this.id) {
      await setDoc(doc(db, collectionName, this.id), new_doc)
    } else {
      this.id = Storage.createId(this.name)
      await setDoc(doc(db, collectionName, this.id), new_doc)
    }
  }

  async delete() {
    if (this.id) {
      await deleteDoc(doc(db, collectionName, this.id))
    }
  }
}

export default Storage