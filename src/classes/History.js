import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "histories"

function docToInstance(document) {
  let data = document.data()
  return data ? new History(document.id, data.date, data.company, data.items, data.destroy, data.weight, data.price, data.payDate) : null
}

class History {
  constructor(id, date, company, items, destroy, weight, price, payDate) {
    this.id = id
    this.date = date
    this.company = company
    this.items = items
    this.destroy = destroy
    this.weight = weight
    this.price = price
    this.payDate = payDate
  }

  static initOne() {
    const newHistory = new History(null, null, null, [], 0, 0, 0, null)
    return newHistory
  }

  static async getAll() {
    const documents = await getDocs(collection(db, collectionName))
    return documents.docs.map(docToInstance)
  }

  static async getById(id) {
    const document = await getDoc(doc(db, collectionName, id))
    return docToInstance(document)
  }

  static async getByCompany(company) {
    const q = query(collection(db, collectionName), where("company", "==", company))
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

  static async listenByCompany(name, callback) {
    const q = query(collection(db, collectionName), where("company", "==", name))
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
      company: this.company,
      items: this.items,
      weight: this.weight,
      price: this.price,
      payDate: this.payDate,
      destroy: this.destroy
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

export default History