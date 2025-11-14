import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "expenseNotes"

function docToInstance(document) {
  let data = document.data()
  return data ? new ExpenseNote(document.id, data.date, data.user, data.reason, data.data, data.price, data.isPaid, data.isRefused, data.refusalComment, data.closeDate) : null
}

class ExpenseNote {
  constructor(id, date, user, reason, data, price, isPaid, isRefused, refusalComment, closeDate) {
    this.id = id
    this.date = date
    this.user = user
    this.reason = reason
    this.data = data
    this.price = price
    this.isPaid = isPaid
    this.isRefused = isRefused
    this.refusalComment = refusalComment
    this.closeDate = closeDate
  }

  static initOne() {
    const newExpenseNote = new ExpenseNote(null, null, null, 'other', '', 0, false, false, '', null)
    return newExpenseNote
  }

  static async getAll() {
    const documents = await getDocs(collection(db, collectionName))
    return documents.docs.map(docToInstance)
  }

  static async getById(id) {
    const document = await getDoc(doc(db, collectionName, id))
    return docToInstance(document)
  }

  static async getByUser(user) {
    const q = query(collection(db, collectionName), where("user", "==", user))
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

  static async listenByUser(name, callback) {
    const q = query(collection(db, collectionName), where("user", "==", name))
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
      user: this.user,
      date: this.date,
      reason: this.reason,
      data: this.data,
      price: this.price,
      isPaid: this.isPaid,
      isRefused: this.isRefused,
      refusalComment: this.refusalComment,
      closeDate: this.closeDate
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

export default ExpenseNote