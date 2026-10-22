package com.letsign.mobile.domain.repository

import com.letsign.mobile.domain.model.Document
import com.letsign.mobile.domain.model.Participant
import com.letsign.mobile.domain.model.SignatureField
import com.letsign.mobile.domain.model.User
import kotlinx.coroutines.flow.Flow

interface DocumentRepository {
    suspend fun createDocument(document: Document): Result<Document>
    suspend fun getDocument(id: String): Result<Document>
    suspend fun listDocuments(ownerId: String, status: String?): Result<List<Document>>
    suspend fun listDocumentsForSigner(signerId: String, situacao: String?): Result<List<Document>>
    suspend fun updateDocument(document: Document): Result<Document>
    suspend fun deleteDocument(id: String): Result<Unit>
    suspend fun sendDocument(id: String): Result<Document>
    suspend fun signDocument(id: String, signatureBase64: String, gestureMetadata: String): Result<Document>
    suspend fun rejectDocument(id: String, motivo: String): Result<Document>
    suspend fun newVersion(id: String, pdfBase64: String, titulo: String?): Result<Document>
    suspend fun downloadPdf(id: String, tipo: String): Result<ByteArray>
    fun observeDocument(id: String): Flow<Document>
    fun observeDocuments(ownerId: String): Flow<List<Document>>
}

interface ParticipantRepository {
    suspend fun addParticipants(documentId: String, participants: List<Participant>): Result<List<Participant>>
    suspend fun getParticipants(documentId: String): Result<List<Participant>>
    suspend fun updateParticipant(participant: Participant): Result<Participant>
    suspend fun updateParticipantStatus(id: String, status: com.letsign.mobile.domain.model.SignerStatus): Result<Unit>
}

interface SignatureFieldRepository {
    suspend fun addFields(fields: List<SignatureField>): Result<List<SignatureField>>
    suspend fun getFields(documentId: String): Result<List<SignatureField>>
    suspend fun updateField(field: SignatureField): Result<SignatureField>
    suspend fun deleteFields(documentId: String): Result<Unit>
}

interface AuthRepository {
    suspend fun login(email: String, senha: String): Result<com.letsign.mobile.domain.model.AuthTokens>
    suspend fun register(nome: String, email: String, telefone: String?, senha: String): Result<com.letsign.mobile.domain.model.AuthTokens>
    suspend fun refreshToken(): Result<String>
    suspend fun getCurrentUser(): Result<User>
    suspend fun logout(): Result<Unit>
    fun getAccessToken(): String?
    fun isAuthenticated(): Boolean
}

interface SignerRepository {
    suspend fun listSigners(adminId: String, busca: String?): Result<List<User>>
    suspend fun getSigner(id: String): Result<User>
    suspend fun createSigner(signer: User): Result<User>
    suspend fun updateSigner(signer: User): Result<User>
    suspend fun deleteSigner(id: String): Result<Unit>
}