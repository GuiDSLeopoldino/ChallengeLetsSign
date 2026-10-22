package com.letsign.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.hilt.lifecycle.HiltViewModel
import com.letsign.mobile.domain.model.User
import com.letsign.mobile.domain.repository.SignerRepository
import dagger.hilt.android.scopes.ActivityRetainedScoped
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SignerViewModel @Inject constructor(
    private val signerRepository: SignerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SignerUiState())
    val uiState: kotlinx.coroutines.flow.StateFlow<SignerUiState> = _uiState.asStateFlow()

    data class SignerUiState(
        val signers: List<User> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
        val successMessage: String? = null,
        val searchQuery: String = ""
    )

    fun loadSigners(adminId: String, busca: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null, searchQuery = busca ?: "") }
            val result = signerRepository.listSigners(adminId, busca)
            result.onSuccess { signers ->
                _uiState.update { it.copy(isLoading = false, signers = signers) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao carregar signatários") }
            }
        }
    }

    fun createSigner(nome: String, email: String, telefone: String?, senha: String, adminId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val signer = User(nome = nome, email = email, telefone = telefone, role = User.Role.SIGNER, adminId = adminId)
            val result = signerRepository.createSigner(signer)
            result.onSuccess { signer ->
                _uiState.update { it.copy(isLoading = false, signers = uiState.signers + signer, successMessage = "Signatário criado") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao criar signatário") }
            }
        }
    }

    fun updateSigner(signer: User) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = signerRepository.updateSigner(signer)
            result.onSuccess { updated ->
                _uiState.update { it.copy(isLoading = false, signers = uiState.signers.map { if (it.id == updated.id) updated else it }, successMessage = "Signatário atualizado") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao atualizar signatário") }
            }
        }
    }

    fun deleteSigner(id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = signerRepository.deleteSigner(id)
            result.onSuccess {
                _uiState.update { it.copy(isLoading = false, signers = uiState.signers.filter { it.id != id }, successMessage = "Signatário removido") }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao remover signatário") }
            }
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(error = null, successMessage = null) }
    }
}