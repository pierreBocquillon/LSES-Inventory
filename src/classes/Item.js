import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "items"

function docToInstance(document) {
  let data = document.data()
  return data ? new Item(document.id, data.icon, data.name, data.storage, data.weight, data.seller, data.amount, data.wanted, data.maxOrder, data.isInstantiated, data.instanceByDate, data.isSecure, data.history) : null
}

class Item {
  constructor(id, icon, name, storage, weight, seller, amount=0, wanted=0, maxOrder=0, isInstantiated=false, instanceByDate=false, isSecure=false, history=[]) {
    this.id = id
    this.icon = icon
    this.name = name
    this.storage = storage
    this.weight = weight
    this.seller = seller
    this.amount = amount
    this.wanted = wanted
    this.maxOrder = maxOrder
    this.isInstantiated = isInstantiated
    this.instanceByDate = instanceByDate
    this.isSecure = isSecure
    this.history = history
  }

  static initOne(name="") {
    let id = Item.createId(name)
    const newItem = new Item(id, "", name, "", 0, "", 0, 0, 0, false, false, false, [])
    return newItem
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
      storage: this.storage,
      weight: this.weight,
      seller: this.seller,
      amount: this.amount,
      wanted: this.wanted,
      maxOrder: this.maxOrder,
      isInstantiated: this.isInstantiated,
      instanceByDate: this.instanceByDate,
      isSecure: this.isSecure,
      history: this.history
    }
    let historyData = {
      date: new Date().getTime(),
      amount: this.amount
    }
    //check (if history in the same minute) update instead of push
    if (new_doc.history.length > 0) {
      let lastEntry = new_doc.history[new_doc.history.length - 1]
      let lastDate = new Date(lastEntry.date)
      let currentDate = new Date(historyData.date)
      if (lastDate.getFullYear() === currentDate.getFullYear() &&
          lastDate.getMonth() === currentDate.getMonth() &&
          lastDate.getDate() === currentDate.getDate() &&
          lastDate.getHours() === currentDate.getHours() &&
          lastDate.getMinutes() === currentDate.getMinutes()) {
        //update last entry
        new_doc.history[new_doc.history.length - 1] = historyData
      } else {
        new_doc.history.push(historyData)
      }
    }else{
      new_doc.history.push(historyData)
    }

    if (new_doc.history.length > 50) {
      new_doc.history = new_doc.history.slice(new_doc.history.length - 50)
    }

    if (this.id) {
      await setDoc(doc(db, collectionName, this.id), new_doc)
    } else {
      this.id = Item.createId(this.name)
      await setDoc(doc(db, collectionName, this.id), new_doc)
    }
  }

  async delete() {
    if (this.id) {
      await deleteDoc(doc(db, collectionName, this.id))
    }
  }
}

export default Item