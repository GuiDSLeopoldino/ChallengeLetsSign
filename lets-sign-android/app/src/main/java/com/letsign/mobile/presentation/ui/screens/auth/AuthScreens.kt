package com.letsign.mobile.presentation.ui.screens.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.spacedBy
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardOptions
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.letsign.mobile.domain.model.User
import com.letsign.mobile.presentation.ui.components.LoadingOverlay
import com.letsign.mobile.presentation.ui.components.LetsSignTopAppBar
import com.letsign.mobile.presentation.viewmodel.AuthViewModel
import dagger.hilt.android.scopes.ActivityRetainedScoped
import kotlinx.coroutines.flow.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onNavigateToRegister: () -> Unit,
    onLoginSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Logo
                Card(
                    modifier = Modifier
                        .size(80.dp)
                        .background(Color(0xFFC2185B))
                ) {
                    androidx.compose.material.icons.filled.Description(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        tint = Color.White
                    )
                }

                Text(
                    text = "LetsSign",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFC2185B)
                )

                Text(
                    text = "Entre na sua conta",
                    fontSize = 16.sp,
                    color = Color(0xFF757575)
                )

                // Email Field
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("E-mail") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                    keyboardOptions = KeyboardOptions.Default.copy(keyboardType = androidx.compose.ui.text.input.KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Password Field
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Senha") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                    trailingIcon = {
                        Icon(
                            if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = if (showPassword) "Ocultar senha" else "Mostrar senha",
                            onClick = { showPassword = !showPassword }
                        )
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions.Default,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                uiState.error?.let { error ->
                    Text(text = error, color = Color.Red, fontSize = 14.sp, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                }

                Button(
                    onClick = { viewModel.login(email, password) },
                    enabled = !uiState.isLoading,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    if (uiState.isLoading) {
                        androidx.compose.material3.CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    } else {
                        Text("Entrar", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                    }
                }

                // Register link
                androidx.compose.foundation.layout.Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(text = "Não tem conta? ", color = Color(0xFF757575))
                    androidx.compose.material3.Text(
                        text = "Cadastre-se",
                        color = Color(0xFFC2185B),
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier
                            .fillMaxWidth()
                            .wrapContentWidth()
                            .fillMaxHeight()
                            .onClick { onNavigateToRegister() }
                    )
                }
            }
        }

        LoadingOverlay(uiState.isLoading, "Autenticando...")
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onNavigateToLogin: () -> Unit,
    onRegisterSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var nome by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var telefone by remember { mutableStateOf("") }
    var senha by remember { mutableStateOf("") }
    var confirmSenha by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    modifier = Modifier
                        .size(80.dp)
                        .background(Color(0xFFC2185B))
                ) {
                    androidx.compose.material.icons.filled.PersonAdd(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        tint = Color.White
                    )
                }

                Text(
                    text = "Criar Conta",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFC2185B)
                )

                Text(
                    text = "Preencha seus dados para começar",
                    fontSize = 16.sp,
                    color = Color(0xFF757575)
                )

                // Nome Field
                OutlinedTextField(
                    value = nome,
                    onValueChange = { nome = it },
                    label = { Text("Nome completo") },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Email Field
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("E-mail") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                    keyboardOptions = KeyboardOptions.Default.copy(keyboardType = androidx.compose.ui.text.input.KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Telefone Field
                OutlinedTextField(
                    value = telefone,
                    onValueChange = { telefone = it },
                    label = { Text("Telefone (opcional)") },
                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                    keyboardOptions = KeyboardOptions.Default.copy(keyboardType = androidx.compose.ui.text.input.KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Password Field
                OutlinedTextField(
                    value = senha,
                    onValueChange = { senha = it },
                    label = { Text("Senha") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                    trailingIcon = {
                        Icon(
                            if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = if (showPassword) "Ocultar" else "Mostrar",
                            onClick = { showPassword = !showPassword }
                        )
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Confirm Password Field
                OutlinedTextField(
                    value = confirmSenha,
                    onValueChange = { confirmSenha = it },
                    label = { Text("Confirmar senha") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                uiState.error?.let { error ->
                    Text(text = error, color = Color.Red, fontSize = 14.sp, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                }

                Button(
                    onClick = {
                        if (senha == confirmSenha) {
                            viewModel.register(nome, email, telefone.ifBlank { null }, senha)
                        } else {
                            viewModel.uiState.update { it.copy(error = "As senhas não coincidem") }
                        }
                    },
                    enabled = !uiState.isLoading,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    if (uiState.isLoading) {
                        androidx.compose.material3.CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White)
                    } else {
                        Text("Criar Conta", fontSize = 16.sp, fontWeight = FontWeight.Medium)
                    }
                }

                // Login link
                androidx.compose.foundation.layout.Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(text = "Já tem conta? ", color = Color(0xFF757575))
                    androidx.compose.material3.Text(
                        text = "Entrar",
                        color = Color(0xFFC2185B),
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier
                            .fillMaxWidth()
                            .wrapContentWidth()
                            .fillMaxHeight()
                            .onClick { onNavigateToLogin() }
                    )
                }
            }
        }

        LoadingOverlay(uiState.isLoading, "Criando conta...")
    }
}