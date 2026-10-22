package com.letsign.mobile.domain.model

import kotlinx.serialization.Serializable
import java.time.Instant
import java.util.UUID

@Serializable
data class User(
    val id: String = UUID.randomUUID().toString(),
    val nome: String,
    val email: String,
    val telefone: String? = null,
    val role: Role = Role.SIGNER,
    val adminId: String? = null,
    val criadoEm: Instant = Instant.now(),
    val atualizadoEm: Instant = Instant.now()
) {
    val isAdmin: Boolean get() = role == Role.ADMIN
    val isSigner: Boolean get() = role == Role.SIGNER
    val initials: String get() = nome.split(" ").joinToString("") { it.firstOrNull().toString() }.uppercase()
}

@Serializable
enum class Role {
    ADMIN,
    SIGNER
}

@Serializable
data class Document(
    val id: String = UUID.randomUUID().toString(),
    val ownerId: String,
    val titulo: String,
    val status: DocumentStatus = DocumentStatus.DRAFT,
    val versao: Int = 1,
    val hashSha256: String,
    val tamanhoBytes: Long,
    val nomeArquivo: String,
    val totalPaginas: Int,
    val mensagem: String? = null,
    val criadoEm: Instant = Instant.now(),
    val enviadoEm: Instant? = null,
    val concluidoEm: Instant? = null,
    val atualizadoEm: Instant = Instant.now(),
    val hashFinal: String? = null,
    val pdfBase64: String? = null,
    val pdfFinalBase64: String? = null
) {
    val isDraft: Boolean get() = status == DocumentStatus.DRAFT
    val isPending: Boolean get() = status == DocumentStatus.PENDING || status == DocumentStatus.PARTIALLY_SIGNED
    val isCompleted: Boolean get() = status == DocumentStatus.COMPLETED
    val isCancelled: Boolean get() = status == DocumentStatus.CANCELLED
    val canEdit: Boolean get() = status == DocumentStatus.DRAFT
    val canSign: Boolean get() = status == DocumentStatus.PENDING || status == DocumentStatus.PARTIALLY_SIGNED
}

@Serializable
enum class DocumentStatus {
    DRAFT,
    PENDING,
    PARTIALLY_SIGNED,
    COMPLETED,
    CANCELLED
}

@Serializable
data class Participant(
    val id: String = UUID.randomUUID().toString(),
    val documentId: String,
    val signerId: String,
    val status: SignerStatus = SignerStatus.PENDING,
    val roleLabel: RoleLabel = RoleLabel.CONTRATADO,
    val required: Boolean = true,
    val ordem: Int = 0,
    val invitedAt: Instant? = null,
    val viewedAt: Instant? = null,
    val signedAt: Instant? = null,
    val rejectedAt: Instant? = null,
    val motivoRecusa: String? = null,
    val assinaturaImagemBase64: String? = null,
    val gestureMetadata: String? = null,
    val ip: String? = null,
    val userAgent: String? = null,
    val signer: User? = null
) {
    val isPending: Boolean get() = status == SignerStatus.PENDING
    val isViewed: Boolean get() = status == SignerStatus.VIEWED
    val isSigned: Boolean get() = status == SignerStatus.SIGNED
    val isRejected: Boolean get() = status == SignerStatus.REJECTED
}

@Serializable
enum class SignerStatus {
    PENDING,
    VIEWED,
    SIGNED,
    REJECTED
}

@Serializable
enum class RoleLabel {
    CONTRATANTE,
    CONTRATADO,
    TESTEMUNHA
}

@Serializable
data class SignatureField(
    val id: String = UUID.randomUUID().toString(),
    val documentId: String,
    val signerId: String,
    val page: Int,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val required: Boolean = true,
    val roleLabel: RoleLabel = RoleLabel.CONTRATADO
)

@Serializable
data class AuditEvent(
    val id: String = UUID.randomUUID().toString(),
    val documentId: String,
    val tipo: AuditType,
    val actorId: String? = null,
    val actorRole: Role? = null,
    val descricao: String,
    val versao: Int,
    val timestamp: Instant = Instant.now(),
    val ip: String? = null,
    val hashDocumentoNoMomento: String? = null,
    val metadados: String? = null
)

@Serializable
enum class AuditType {
    CREATED,
    FIELDS_UPDATED,
    SENT,
    VIEWED,
    SIGNED,
    REJECTED,
    VERSION_CREATED,
    COMPLETED
}

@Serializable
data class AuthTokens(
    val accessToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long = 7 * 24 * 3600,
    val usuario: User
)