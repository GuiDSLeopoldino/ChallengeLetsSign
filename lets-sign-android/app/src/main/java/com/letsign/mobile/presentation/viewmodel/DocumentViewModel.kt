package com.letsign.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.hilt.lifecycle.HiltViewModel
import com.letsign.mobile.domain.model.Document
import com.letsign.mobile.domain.model.DocumentStatus
import com.letsign.mobile.domain.model.Participant
import com.letsign.mobile.domain.model.SignatureField
import com.letsign.mobile.domain.model.User
import com.letsign.mobile.domain.repository.DocumentRepository
import com.letsign.mobile.domain.repository.ParticipantRepository
import com.letsign.mobile.domain.repository.SignatureFieldRepository
import dagger.hilt.android.scopes.ActivityRetainedScoped
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DocumentViewModel @Inject constructor(
    private val documentRepository: DocumentRepository,
    private val participantRepository: ParticipantRepository,
    private val fieldRepository: SignatureFieldRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DocumentUiState())
    val uiState: kotlinx.coroutines.flow.StateFlow<DocumentUiState> = _uiState.asStateFlow()

    data class DocumentUiState(
        val documents: List<Document> = emptyList(),
        val currentDocument: Document? = null,
        val participants: List<com.letsign.mobile.domain.model.Participant> = emptyList(),
        val fields: List<SignatureField> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
        val successMessage: String? = null
    )

    fun loadDocuments(ownerId: String, status: String? = null) {
        // For signer view
    }

    fun loadDocumentsForSigner(signerId: String, situacao: String? = null) {
        // For signer view
    }

    fun createDocument(document: Document) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = documentRepository.createDocument(document)
            result.onSuccess { doc ->
                _uiState.update { it.copy(isLoading = false, currentDocument = doc, successMessage = "Documento criado") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao criar documento") }
            }
        }
    }

    fun getDocument(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = documentRepository.getDocument(id)
            result.onSuccess { doc ->
                _uiState.update { it.copy(isLoading = false, currentDocument = doc) }
                loadParticipants(id)
                loadFields(id)
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao carregar documento") }
            }
        }
    }

    fun loadParticipants(documentId: String) {
        viewModelScope.launch {
            val result = participantRepository.getParticipants(documentId)
            result.onSuccess { participants ->
                _uiState.update { it.copy(participants = participants) }
            }
        }
    }

    fun loadFields(documentId: String) {
        viewModelScope.launch {
            val result = fieldRepository.getFields(documentId)
            result.onSuccess { fields ->
                _uiState.update { it.copy(fields = fields) }
            }
        }
    }

    fun sendDocument(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = documentRepository.sendDocument(id)
            result.onSuccess { doc ->
                _uiState.update { it.copy(isLoading = false, currentDocument = doc, successMessage = "Documento enviado") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao enviar documento") }
            }
        }
    }

    fun signDocument(id: String, signatureBase64: String, gestureMetadata: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = documentRepository.signDocument(id, signatureBase64)
            result.onSuccess { doc ->
                _uiState.update { it.copy(isLoading = false, currentDocument = doc, successMessage = "Documento assinado com sucesso!") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao assinar documento") }
            }
        }
    }

    fun rejectDocument(id: String, motivo: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = documentRepository.rejectDocument(id, motivo)
            result.onSuccess { doc ->
                _uiState.update { it.copy(isLoading = false, currentDocument = doc, successMessage = "Recusa registrada") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao recusar documento") }
            }
        }
    }

    fun newVersion(id: String, pdfBase64: String, titulo: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = documentRepository.newVersion(id, pdfBase64, titulo)
            result.onSuccess { doc ->
                _uiState.update { it.copy(isLoading = false, currentDocument = doc, successMessage = "Nova versão criada") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao criar nova versão") }
            }
        }
    }

    fun downloadPdf(id: String, tipo: String, onResult: (ByteArray) -> Unit) {
        viewModelScope.launch {
            val result = documentRepository.downloadPdf(id, tipo)
            result.onSuccess { bytes ->
                onResult(bytes)
            }.onFailure { e ->
                _uiState.update { it.copy(error = e.message ?: "Erro ao baixar PDF") }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(error = null, successMessage = null) }
    }

    companion object {
        fun getStatusColor(status: DocumentStatus): Int {
            return when (status) {
                DocumentStatus.DRAFT -> 0xFF9E9E9E // Gray
                DocumentStatus.PENDING -> 0xFFFFC107 // Amber
                DocumentStatus.PARTIALLY_SIGNED -> 0xFFF57C00 // Orange
                DocumentStatus.COMPLETED -> 0xFF4CAF50 // Green
                DocumentStatus.CANCELLED -> 0xFFF44336 // Red
            }
        }
    }
}