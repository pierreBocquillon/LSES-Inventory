import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore"
let db = getFirestore()

let collectionName = "employees"

function docToInstance(document) {
    let data = document.data()
    return data ? new Employee(document.id, data.name, data.email, data.role, data.sex, data.phone, data.specialties, data.chiefSpecialty, data.birthDate, data.arrivalDate, data.cdiDate, data.lastPromotionDate, data.medicalDegreeDate, data.helicopterTrainingDate, data.helicopterTrainingReimbursed) : null
}

class Employee {
    constructor(id, name, email, role, sex, phone, specialties, chiefSpecialty, birthDate, arrivalDate, cdiDate, lastPromotionDate, medicalDegreeDate, helicopterTrainingDate, helicopterTrainingReimbursed) {
        this.id = id
        this.name = name
        this.email = email
        this.role = role
        this.sex = sex
        this.phone = phone
        this.specialties = specialties || []
        this.chiefSpecialty = chiefSpecialty || null
        this.birthDate = birthDate || null
        this.arrivalDate = arrivalDate || null
        this.cdiDate = cdiDate || null
        this.lastPromotionDate = lastPromotionDate || null
        this.medicalDegreeDate = medicalDegreeDate || null
        this.helicopterTrainingDate = helicopterTrainingDate || null
        this.helicopterTrainingReimbursed = helicopterTrainingReimbursed || false
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

    async save() {
        const new_doc = {
            name: this.name,
            email: this.email,
            role: this.role,
            sex: this.sex,
            phone: this.phone,
            specialties: this.specialties,
            chiefSpecialty: this.chiefSpecialty,
            birthDate: this.birthDate || null,
            arrivalDate: this.arrivalDate || null,
            cdiDate: this.cdiDate || null,
            lastPromotionDate: this.lastPromotionDate || null,
            medicalDegreeDate: this.medicalDegreeDate || null,
            helicopterTrainingDate: this.helicopterTrainingDate || null,
            helicopterTrainingReimbursed: this.helicopterTrainingReimbursed || false
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

export default Employee
