package com.letsign.mobile.data.api

import com.letsign.mobile.domain.model.Document
import com.letsign.mobile.domain.model.Participant
import com.letsign.mobile.domain.model.SignatureField
import com.letsign.mobile.domain.model.User
import com.letsign.mobile.domain.model.AuthTokens
import com.letsign.mobile.domain.model.AuditEvent
import com.letsign.mobile.domain.model.SignerStatus
import kotlinx.coroutines.flow.Flow
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): Response<AuthTokens>

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): Response<AuthTokens>

    @GET("auth/me")
    suspend fun me(): Response<User>

    @POST("auth/refresh")
    suspend fun refresh(): Response<AuthTokens>
}

data class LoginRequest(
    val email: String,
    val senha: String
)

data class RegisterRequest(
    val nome: String,
    val email: String,
    val telefone: String?,
    val senha: String
)

interface DocumentsApi {
    @Multipart
    @POST("documents")
    suspend fun createDocument(
        @Part("pdf") pdf: MultipartBody.Part,
        @Part("titulo") titulo: RequestBody
    ): Response<Document>

    @GET("documents")
    suspend fun listDocuments(
        @Query("status") status: String?,
        @Query("situacao") situacao: String?
    ): Response<List<Document>>

    @GET("documents/{id}")
    suspend fun getDocument(@Path("id") id: String): Response<Document>

    @GET("documents/{id}/file")
    suspend fun downloadPdf(
        @Path("id") id: String,
        @Query("tipo") tipo: String
    ): Response<ResponseBody>

    @PUT("documents/{id}/participants")
    suspend fun setParticipants(
        @Path("id") id: String,
        @Body body: ParticipantsRequest
    ): Response<Document>

    @POST("documents/{id}/fields")
    suspend fun setFields(
        @Path("id") id: String,
        @Body body: FieldsRequest
    ): Response<Document>

    @POST("documents/{id}/send")
    suspend fun sendDocument(
        @Path("id") id: String,
        @Body body: SendRequest
    ): Response<SendResponse>

    @Multipart
    @POST("documents/{id}/version")
    suspend fun newVersion(
        @Path("id") id: String,
        @Part("pdf") pdf: MultipartBody.Part,
        @Part("titulo") titulo: RequestBody
    ): Response<Document>

    @POST("documents/{id}/sign")
    suspend fun signDocument(
        @Path("id") id: String,
        @Body body: SignRequest
    ): Response<Document>

    @POST("documents/{id}/reject")
    suspend fun rejectDocument(
        @Path("id") id: String,
        @Body body: RejectRequest
    ): Response<Document>

    @GET("documents/{id}/audit")
    suspend fun getAudit(@Path("id") id: String): Response<AuditResponse>

    @GET("documents/{id}/verify")
    suspend fun verifyHash(
        @Path("id") id: String,
        @Query("hash") hash: String
    ): Response<VerifyResponse>
}

data class ParticipantsRequest(
    val participantes: List<ParticipantRequest>
)

data class ParticipantRequest(
    val signerId: String,
    val roleLabel: String,
    val required: Boolean = true
)

data class FieldsRequest(
    val fields: List<FieldRequest>
)

data class FieldRequest(
    val signerId: String,
    val page: Int,
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val required: Boolean = true,
    val roleLabel: String? = null
)

data class SendRequest(
    val mensagem: String? = null,
    val participantes: List<ParticipantRequest>? = null,
    val fields: List<FieldRequest>? = null
)

data class SendResponse(
    val jaEnviado: Boolean,
    val mensagem: String,
    val documento: Document
)

data class SignRequest(
    val assinaturaImagemBase64: String,
    val gestureMetadata: String? = null
)

data class RejectRequest(
    val motivo: String
)

data class AuditResponse(
    val documentId: String,
    val titulo: String,
    val versaoAtual: Int,
    val hashAtual: String,
    val hashFinal: String?,
    val status: String,
    val eventos: List<AuditEvent>
)

data class VerifyResponse(
    val valido: Boolean,
    val tipo: String?,
    val versao: Int?,
    val mensagem: String?
)

interface SignersApi {
    @GET("signers")
    suspend fun listSigners(@Query("busca") busca: String?): Response<List<User>>

    @GET("signers/{id}")
    suspend fun getSigner(@Path("id") id: String): Response<User>

    @POST("signers")
    suspend fun createSigner(@Body body: SignerRequest): Response<User>

    @PATCH("signers/{id}")
    suspend fun updateSigner(@Path("id") id: String, @Body body: SignerRequest): Response<User>

    @DELETE("signers/{id}")
    suspend fun deleteSigner(@Path("id") id: String): Response<Unit>
}

data class SignerRequest(
    val nome: String,
    val email: String,
    val telefone: String?,
    val senha: String
)