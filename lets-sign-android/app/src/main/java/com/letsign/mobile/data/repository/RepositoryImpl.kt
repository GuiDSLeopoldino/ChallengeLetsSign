package com.letsign.mobile.data.repository

import com.letsign.mobile.data.api.ApiClient
import com.letsign.mobile.data.api.ApiServices
import com.letsign.mobile.data.local.TokenManager
import com.letsign.mobile.domain.model.Document
import com.letsign.mobile.domain.model.Participant
import com.letsign.mobile.domain.model.SignatureField
import com.letsign.mobile.domain.model.User
import com.letsign.mobile.domain.model.AuthTokens
import com.letsign.mobile.domain.model.AuditEvent
import com.letsign.mobile.domain.repository.AuthRepository
import com.letsign.mobile.domain.repository.DocumentRepository
import com.letsign.mobile.domain.repository.ParticipantRepository
import com.letsign.mobile.domain.repository.SignatureFieldRepository
import com.letsign.mobile.domain.repository.SignerRepository
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Response
import java.io.File
import java.util.UUID

class AuthRepositoryImpl(
    private val api: ApiServices = ApiClient.authApi,
    private val tokenManager: TokenManager,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : AuthRepository {

    override suspend fun login(email: String, senha: String): Result<AuthTokens> = withContext(ioDispatcher) {
        try {
            val response = api.login(ApiServices.LoginRequest(email, senha))
            if (response.isSuccessful) {
                val tokens = response.body()!!
                tokenManager.saveTokens(tokens.accessToken)
                tokenManager.saveUserData(tokens.usuario.toJson())
                Result.success(tokens)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro no login"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun register(nome: String, email: String, telefone: String?, senha: String): Result<AuthTokens> = withContext(ioDispatcher) {
        try {
            val response = api.register(ApiServices.RegisterRequest(nome, email, telefone, senha))
            if (response.isSuccessful) {
                val tokens = response.body()!!
                tokenManager.saveTokens(tokens.accessToken)
                tokenManager.saveUserData(tokens.usuario.toJson())
                Result.success(tokens)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro no cadastro"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun refreshToken(): Result<String> = withContext(ioDispatcher) {
        try {
            val response = api.refresh()
            if (response.isSuccessful) {
                val tokens = response.body()!!
                tokenManager.saveTokens(tokens.accessToken)
                Result.success(tokens.accessToken)
            } else {
                tokenManager.clearTokens()
                Result.failure(Exception("Token expirado"))
            }
        } catch (e: Exception) {
            tokenManager.clearTokens()
            Result.failure(e)
        }
    }

    override suspend fun getCurrentUser(): Result<User> = withContext(ioDispatcher) {
        try {
            val cached = tokenManager.getUserData()?.let { User.fromJson(it) }
            if (cached != null) {
                Result.success(cached)
            } else {
                val response = api.me()
                if (response.isSuccessful) {
                    val user = response.body()!!
                    tokenManager.saveUserData(user.toJson())
                    Result.success(user)
                } else {
                    Result.failure(Exception("Usuário não encontrado"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> = withContext(ioDispatcher) {
        tokenManager.clearTokens()
        Result.success(Unit)
    }

    override fun getAccessToken(): String? = tokenManager.getAccessToken()

    override fun isAuthenticated(): Boolean = tokenManager.isAuthenticated()
}

class DocumentRepositoryImpl(
    private val api: ApiServices = ApiClient.documentsApi,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : DocumentRepository {

    private val _documentsFlow = MutableStateFlow<List<Document>>(emptyList())
    override val documentsFlow: kotlinx.coroutines.flow.StateFlow<List<Document>> = _documentsFlow.asStateFlow()

    override suspend fun createDocument(document: Document): Result<Document> = withContext(ioDispatcher) {
        try {
            val pdfFile = File(document.pdfBase64?.let { saveBase64ToFile(it, "doc_${UUID.randomUUID()}.pdf") } ?: "")
            val pdfPart = MultipartBody.Part.createFormData(
                "pdf",
                document.nomeArquivo,
                pdfFile.asRequestBody("application/pdf".toMediaTypeOrNull())
            )
            val tituloPart = document.titulo.toRequestBody("text/plain".toMediaTypeOrNull())

            val response = api.createDocument(pdfPart, tituloPart)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao criar documento"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getDocument(id: String): Result<Document> = withContext(ioDispatcher) {
        try {
            val response = api.getDocument(id)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Documento não encontrado"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun listDocuments(ownerId: String, status: String?): Result<List<Document>> = withContext(ioDispatcher) {
        try {
            val response = api.listDocuments(status, null)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao listar documentos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun listDocumentsForSigner(signerId: String, situacao: String?): Result<List<Document>> = withContext(ioDispatcher) {
        try {
            val response = api.listDocuments(null, situacao)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao listar documentos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateDocument(document: Document): Result<Document> = withContext(ioDispatcher) {
        // Not directly available in API, would need specific endpoints
        Result.failure(UnsupportedOperationException("Use specific endpoints for updates"))
    }

    override suspend fun deleteDocument(id: String): Result<Unit> = withContext(ioDispatcher) {
        // Not available in current API
        Result.failure(UnsupportedOperationException("Delete not implemented in API"))
    }

    override suspend fun sendDocument(id: String): Result<Document> = withContext(ioDispatcher) {
        try {
            val response = api.sendDocument(id, ApiServices.SendRequest())
            if (response.isSuccessful) {
                Result.success(response.body()!!.documento)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao enviar documento"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun signDocument(id: String, signatureBase64: String, gestureMetadata: String): Result<Document> = withContext(ioDispatcher) {
        try {
            val response = api.signDocument(id, ApiServices.SignRequest(signatureBase64, gestureMetadata))
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao assinar documento"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun rejectDocument(id: String, motivo: String): Result<Document> = withContext(ioDispatcher) {
        try {
            val response = api.rejectDocument(id, ApiServices.RejectRequest(motivo))
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao recusar documento"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun newVersion(id: String, pdfBase64: String, titulo: String?): Result<Document> = withContext(ioDispatcher) {
        try {
            val pdfFile = File(saveBase64ToFile(pdfBase64, "doc_${UUID.randomUUID()}.pdf"))
            val pdfPart = MultipartBody.Part.createFormData(
                "pdf",
                "documento_versao_${System.currentTimeMillis()}.pdf",
                pdfFile.asRequestBody("application/pdf".toMediaTypeOrNull())
            )
            val tituloPart = (titulo ?: "").toRequestBody("text/plain".toMediaTypeOrNull())

            val response = api.newVersion(id, pdfPart, tituloPart)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao criar nova versão"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun downloadPdf(id: String, tipo: String): Result<ByteArray> = withContext(ioDispatcher) {
        try {
            val response = api.downloadPdf(id, tipo)
            if (response.isSuccessful) {
                Result.success(response.body()!!.bytes())
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao baixar PDF"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun observeDocument(id: String): kotlinx.coroutines.flow.Flow<Document> {
        // Would need WebSocket or polling for real-time updates
        return kotlinx.coroutines.flow.flowOf()
    }

    override fun observeDocuments(ownerId: String): kotlinx.coroutines.flow.Flow<List<Document>> {
        return _documentsFlow
    }

    companion object {
        fun saveBase64ToFile(base64: String, fileName: String): String {
            val bytes = android.util.Base64.decode(base64, android.util.Base64.DEFAULT)
            val file = File(android.os.Environment.getExternalStorageDirectory(), fileName)
            file.writeBytes(bytes)
            return file.absolutePath
        }
    }
}

class ParticipantRepositoryImpl(
    private val api: ApiServices = ApiClient.documentsApi,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : ParticipantRepository {
    override suspend fun addParticipants(documentId: String, participants: List<Participant>): Result<List<Participant>> = withContext(ioDispatcher) {
        try {
            val request = ApiServices.ParticipantsRequest(
                participants.map { ApiServices.ParticipantRequest(it.signerId, it.roleLabel.name, it.required) }
            )
            val response = api.setParticipants(documentId, request)
            if (response.isSuccessful) {
                Result.success(participants)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao adicionar participantes"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getParticipants(documentId: String): Result<List<Participant>> = withContext(ioDispatcher) {
        try {
            val response = api.getDocument(documentId)
            if (response.isSuccessful) {
                Result.success(response.body()?.signers ?: emptyList())
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao buscar participantes"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateParticipant(participant: Participant): Result<Participant> = withContext(ioDispatcher) {
        // Update would be through document update
        Result.success(participant)
    }

    override suspend fun updateParticipantStatus(id: String, status: com.letsign.mobile.domain.model.SignerStatus): Result<Unit> = withContext(ioDispatcher) {
        // Status updated through sign/reject endpoints
        Result.success(Unit)
    }
}

class SignatureFieldRepositoryImpl(
    private val api: ApiServices = ApiClient.documentsApi,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : SignatureFieldRepository {
    override suspend fun addFields(fields: List<SignatureField>): Result<List<SignatureField>> = withContext(ioDispatcher) {
        try {
            val request = ApiServices.FieldsRequest(
                fields.map { ApiServices.FieldRequest(
                    it.signerId,
                    it.page,
                    it.x,
                    it.y,
                    it.width,
                    it.height,
                    it.required,
                    it.roleLabel.name
                ) }
            )
            val response = api.setFields(fields.first().documentId, request)
            if (response.isSuccessful) {
                Result.success(fields)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao adicionar campos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getFields(documentId: String): Result<List<SignatureField>> = withContext(ioDispatcher) {
        try {
            val response = api.getDocument(documentId)
            if (response.isSuccessful) {
                Result.success(response.body()?.fields ?: emptyList())
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao buscar campos"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateField(field: SignatureField): Result<SignatureField> = withContext(ioDispatcher) {
        Result.success(field)
    }

    override suspend fun deleteFields(documentId: String): Result<Unit> = withContext(ioDispatcher) {
        Result.success(Unit)
    }
}

class SignerRepositoryImpl(
    private val api: ApiServices = ApiClient.signersApi,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : SignerRepository {
    override suspend fun listSigners(adminId: String, busca: String?): Result<List<User>> = withContext(ioDispatcher) {
        try {
            val response = api.listSigners(busca)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao listar signatários"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getSigner(id: String): Result<User> = withContext(ioDispatcher) {
        try {
            val response = api.getSigner(id)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Signatário não encontrado"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createSigner(signer: User): Result<User> = withContext(ioDispatcher) {
        try {
            val request = ApiServices.SignerRequest(signer.nome, signer.email, signer.telefone, "temp_password")
            val response = api.createSigner(request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao criar signatário"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateSigner(signer: User): Result<User> = withContext(ioDispatcher) {
        try {
            val request = ApiServices.SignerRequest(signer.nome, signer.email, signer.telefone, "unchanged")
            val response = api.updateSigner(signer.id, request)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao atualizar signatário"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteSigner(id: String): Result<Unit> = withContext(ioDispatcher) {
        try {
            val response = api.deleteSigner(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Erro ao excluir signatário"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// Extension for JSON conversion
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString

fun <T> T.toJson(): String = Json.encodeToString(this)
fun String.fromJson(): T = Json.decodeFromString(this)