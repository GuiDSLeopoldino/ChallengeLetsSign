package com.letsign.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.hilt.lifecycle.HiltViewModel
import com.letsign.mobile.domain.model.AuthTokens
import com.letsign.mobile.domain.model.User
import com.letsign.mobile.domain.repository.AuthRepository
import dagger.hilt.android.scopes.ActivityRetainedScoped
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: kotlinx.coroutines.flow.StateFlow<AuthUiState> = _uiState.asStateFlow()

    data class AuthUiState(
        val isLoading: Boolean = false,
        val error: String? = null,
        val user: User? = null,
        val isAuthenticated: Boolean = false
    )

    init {
        checkAuthStatus()
    }

    fun checkAuthStatus() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = authRepository.getCurrentUser()
            result.onSuccess { user ->
                _uiState.update { it.copy(isLoading = false, user = user, isAuthenticated = true) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, isAuthenticated = false) }
            }
        }
    }

    fun login(email: String, senha: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = authRepository.login(email, senha)
            result.onSuccess { tokens ->
                _uiState.update { it.copy(isLoading = false, user = tokens.usuario, isAuthenticated = true) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao fazer login") }
            }
        }
    }

    fun register(nome: String, email: String, telefone: String?, senha: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val result = authRepository.register(nome, email, telefone, senha)
            result.onSuccess { tokens ->
                _uiState.update { it.copy(isLoading = false, user = tokens.usuario, isAuthenticated = true) }
            }.onFailure { e ->
                _uiState.update { it.copy(isLoading = false, error = e.message ?: "Erro ao cadastrar") }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.update { it.copy(user = null, isAuthenticated = false) }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}