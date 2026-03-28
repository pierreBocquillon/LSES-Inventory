import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore"
let db = getFirestore()

let collectionName = "absences"

function docToInstance(document) {
  let data = document.data()
  return data ? new Absence(
    document.id, 
    data.userId, 
    data.startDate, 
    data.endDate, 
    data.isFullDay, 
    data.reason, 
    data.status, 
    data.type, 
    data.slot,
    data.recurrence || 'none'
  ) : null
}

class Absence {
  constructor(id, userId, startDate, endDate, isFullDay, reason, status = 'pending', type = 'absence', slot = null, recurrence = 'none') {
    this.id = id
    this.userId = userId
    this.startDate = startDate
    this.endDate = endDate
    this.isFullDay = isFullDay
    this.reason = reason
    this.status = status // pending, approved, refused
    this.type = type // absence, leave
    this.slot = slot // full, morning, afternoon, evening
    this.recurrence = recurrence
  }

  static initOne() {
    return new Absence(null, null, null, null, true, '', 'pending', 'absence', null)
  }

  static async getAll() {
    const documents = await getDocs(collection(db, collectionName))
    return documents.docs.map(docToInstance)
  }

  static async getById(id) {
    const document = await getDoc(doc(db, collectionName, id))
    return docToInstance(document)
  }

  static async getByUser(userId) {
    const q = query(collection(db, collectionName), where("userId", "==", userId))
    const documents = await getDocs(q)
    return documents.docs.map(docToInstance)
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

  static listenById(id, callback) {
    return onSnapshot(doc(db, collectionName, id), snapshot => {
      callback(docToInstance(snapshot))
    })
  }

  async save() {
    const new_doc = {
      userId: this.userId,
      startDate: this.startDate,
      endDate: this.endDate,
      isFullDay: this.isFullDay,
      reason: this.reason,
      status: this.status,
      type: this.type,
      slot: this.slot,
      recurrence: this.recurrence || 'none'
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

export default Absence
