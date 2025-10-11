import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId, limit, orderBy } from "firebase/firestore"
let db = getFirestore()

let collectionName = "logs"

function docToInstance(document) {
  let data = document.data()
  return data ? new Log(document.id, data.user, data.type, data.description) : null
}

class Log {
  constructor(id, user, type, description) {
    this.id = id
    this.user = user
    this.type = type
    this.description = description
  }

  static initOne(user="", type="", description="") {
    let id = new Date().getTime().toString()
    const newLog = new Log(id, user, type, description)
    return newLog
  }

  static async getAll() {
    const documents = await getDocs(collection(db, collectionName))
    return documents.docs.map(docToInstance)
  }

  static async getById(id) {
    const document = await getDoc(doc(db, collectionName, id))
    return docToInstance(document)
  }

  async save() {
    const new_doc = {
      user: this.user,
      type: this.type,
      description: this.description,
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

export default Log