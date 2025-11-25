import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "vehicleHistories"

function docToInstance(document) {
  let data = document.data()
  return data ? new VehicleHistory(document.id, data.date, data.vehicle, data.message, data.price) : null
}

class VehicleHistory {
  constructor(id, date, vehicle, message, price) {
    this.id = id
    this.date = date
    this.vehicle = vehicle
    this.message = message
    this.price = price
  }

  static initOne() {
    const newVehicleHistory = new VehicleHistory(null, null, null, "", 0, null)
    return newVehicleHistory
  }

  static async getAll() {
    const documents = await getDocs(collection(db, collectionName))
    return documents.docs.map(docToInstance)
  }

  static async getById(id) {
    const document = await getDoc(doc(db, collectionName, id))
    return docToInstance(document)
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

  async save() {
    const new_doc = {
      date: this.date,
      vehicle: this.vehicle,
      message: this.message,
      price: this.price,
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

export default VehicleHistory