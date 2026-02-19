import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore"
let db = getFirestore()

let collectionName = "employees"

function docToInstance(document) {
    let data = document.data()
    // If chiefSpecialty exists (old format)
    let chiefSpecs = data.chiefSpecialties || []
    if (data.chiefSpecialty && !chiefSpecs.length) {
        chiefSpecs = [data.chiefSpecialty]
    }
    return data ? new Employee(document.id, data.name, data.email, data.role, data.sex, data.phone, data.specialties, chiefSpecs, data.birthDate, data.arrivalDate, data.cdiDate, data.lastPromotionDate, data.medicalDegreeDate, data.helicopterTrainingDate, data.helicopterTrainingReimbursed, data.trainingRequests, data.promotionRequest, data.rankPromotionRequest, data.validatedSubCompetencies, data.competencyProgress, data.lastFollowUpDate, data.simpleFault, data.suspension, data.isTrainerTrainee, data.simulations, data.isRHTrainee) : null
}


class Employee {
    constructor(id, name, email, role, sex, phone, specialties, chiefSpecialties, birthDate, arrivalDate, cdiDate, lastPromotionDate, medicalDegreeDate, helicopterTrainingDate, helicopterTrainingReimbursed, trainingRequests, promotionRequest, rankPromotionRequest, validatedSubCompetencies, competencyProgress, lastFollowUpDate, simpleFault, suspension, isTrainerTrainee, simulations, isRHTrainee) {
        this.id = id
        this.name = name
        this.email = email
        this.role = role
        this.sex = sex
        this.phone = phone
        this.specialties = specialties || []
        this.chiefSpecialties = chiefSpecialties || []
        this.birthDate = birthDate || null
        this.arrivalDate = arrivalDate || null
        this.cdiDate = cdiDate || null
        this.lastPromotionDate = lastPromotionDate || null
        this.medicalDegreeDate = medicalDegreeDate || null
        this.helicopterTrainingDate = helicopterTrainingDate || null
        this.helicopterTrainingReimbursed = helicopterTrainingReimbursed || false
        this.trainingRequests = trainingRequests || []
        this.promotionRequest = promotionRequest || null
        this.rankPromotionRequest = rankPromotionRequest || null

        this.competencyProgress = competencyProgress || {}
        if (validatedSubCompetencies && Array.isArray(validatedSubCompetencies)) {
            validatedSubCompetencies.forEach(id => {
                this.competencyProgress[id] = 'validated'
            })
        }
        this.lastFollowUpDate = lastFollowUpDate || null
        this.simpleFault = simpleFault || null
        this.suspension = suspension || null
        this.isTrainerTrainee = isTrainerTrainee || false
        this.simulations = simulations || []
        this.isRHTrainee = isRHTrainee || false
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
            chiefSpecialties: this.chiefSpecialties,
            birthDate: this.birthDate || null,
            arrivalDate: this.arrivalDate || null,
            cdiDate: this.cdiDate || null,
            lastPromotionDate: this.lastPromotionDate || null,
            medicalDegreeDate: this.medicalDegreeDate || null,
            helicopterTrainingDate: this.helicopterTrainingDate || null,
            helicopterTrainingReimbursed: this.helicopterTrainingReimbursed || false,
            trainingRequests: this.trainingRequests || [],
            promotionRequest: this.promotionRequest || null,
            rankPromotionRequest: this.rankPromotionRequest || null,
            competencyProgress: this.competencyProgress || {},
            lastFollowUpDate: this.lastFollowUpDate || null,
            simpleFault: this.simpleFault || null,
            suspension: this.suspension || null,
            isTrainerTrainee: this.isTrainerTrainee || false,
            simulations: this.simulations || [],
            isRHTrainee: this.isRHTrainee || false
        }

        if (this.id) {
            await setDoc(doc(db, collectionName, this.id), new_doc, { merge: true })
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
