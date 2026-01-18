import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "autopsies"

function docToInstance(document) {
  let data = document.data()
  return data ? new Autopsie(document.id, data.name, data.cid, data.genderIsMale, data.doctor, data.legist, data.injuries, data.bloodBilan, data.diagnostic, data.interventionReport, data.eventChronology, data.autopsySummary, data.autopsyDate) : null
}

class Autopsie {
  constructor(id, name, cid, genderIsMale, doctor, legist, injuries, bloodBilan, diagnostic, interventionReport, eventChronology, autopsySummary, autopsyDate) {
    this.id = id
    this.name = name
    this.cid = cid
    this.genderIsMale = genderIsMale
    this.doctor = doctor
    this.legist = legist
    this.injuries = injuries
    this.bloodBilan = bloodBilan
    this.diagnostic = diagnostic
    this.interventionReport = interventionReport
    this.eventChronology = eventChronology
    this.autopsySummary = autopsySummary
    this.autopsyDate = autopsyDate
  }

  static initOne() {
    let injuries = [{
      externalAnalysis: '',
      internalAnalysis: '',
      points: []
    }]
    const newAutopsie = new Autopsie(null, '', '', false, '', '', injuries, ``, ``, ``, ``, ``, 0)
    return newAutopsie
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
      name: this.name,
      cid: this.cid,
      genderIsMale: this.genderIsMale,
      doctor: this.doctor,
      legist: this.legist,
      injuries: this.injuries,
      bloodBilan: this.bloodBilan,
      diagnostic: this.diagnostic,
      interventionReport: this.interventionReport,
      eventChronology: this.eventChronology,
      autopsySummary: this.autopsySummary,
      autopsyDate: this.autopsyDate
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

export default Autopsie