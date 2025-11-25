import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "vehicles"

function docToInstance(document) {
  let data = document.data()
  return data ? new Vehicle(document.id, data.icon, data.name, data.imat, data.where, data.underGuard, data.recupDate, data.lastRepairDate, data.hideAlert) : null
}

class Vehicle {
  constructor(id, icon, name, imat, where, underGuard, recupDate, lastRepairDate, hideAlert) {
    this.id = id
    this.icon = icon
    this.name = name
    this.imat = imat
    this.where = where
    this.underGuard = underGuard
    this.recupDate = recupDate
    this.lastRepairDate = lastRepairDate
    this.hideAlert = hideAlert
  }

  static initOne(name="") {
    let id = Vehicle.createId(name)
    const newVehicle = new Vehicle(id, "", "", "", "garage", false, null, 0, false)
    return newVehicle
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
      imat: this.imat,
      where: this.where,
      underGuard: this.underGuard,
      recupDate: this.recupDate,
      lastRepairDate: this.lastRepairDate,
      hideAlert: this.hideAlert,
    }

    if (this.id) {
      await setDoc(doc(db, collectionName, this.id), new_doc)
    } else {
      this.id = Vehicle.createId(this.name)
      await setDoc(doc(db, collectionName, this.id), new_doc)
    }
  }

  async delete() {
    if (this.id) {
      await deleteDoc(doc(db, collectionName, this.id))
    }
  }
}

export default Vehicle